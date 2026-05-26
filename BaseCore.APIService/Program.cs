using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System.Text;
using BaseCore.Services;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        // Bỏ qua vòng tròn object (order → orderDetails → order → ...)
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();

// Swagger Configuration
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BaseCore API Service",
        Version = "v1",
        Description = "Business Logic Microservice - Products, Categories, Orders (Bài 10, 11)"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter JWT token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

//MySQL Configuration with EF Core
//var connectionString = builder.Configuration.GetConnectionString("MySQL")
//    ?? "Server=localhost;Database=BaseCoreSales;User=root;Password=;";
//builder.Services.AddDbContext<MySqlDbContext>(options =>
//    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
// Repositories
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Services
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IOrderService, OrderService>();

builder.Services.AddDbContext<MySqlDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("ConnectedDb"));
});


// Repository Registration - Products, Categories, Orders
builder.Services.AddScoped<IProductRepositoryEF, ProductRepositoryEF>();
builder.Services.AddScoped<ICategoryRepositoryEF, CategoryRepositoryEF>();
builder.Services.AddScoped<IOrderRepositoryEF, OrderRepositoryEF>();
builder.Services.AddScoped<IOrderDetailRepositoryEF, OrderDetailRepositoryEF>();
builder.Services.AddScoped<IBlogRepositoryEF, BlogRepositoryEF>();

// JWT Authentication
var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:SecretKey"] ?? "YourSecretKeyForAuthenticationShouldBeLongEnough");
builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

var app = builder.Build();

// Auto migrate database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MySqlDbContext>();
    db.Database.EnsureCreated();

    // Đảm bảo các cột mới tồn tại trong bảng Orders (idempotent - an toàn khi chạy nhiều lần)
    try
    {
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Orders' AND COLUMN_NAME='DepositAmount')
                ALTER TABLE Orders ADD DepositAmount decimal(18,2) NOT NULL DEFAULT 0;
        ");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Orders' AND COLUMN_NAME='CustomerName')
                ALTER TABLE Orders ADD CustomerName nvarchar(100) NOT NULL DEFAULT N'';
        ");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Orders' AND COLUMN_NAME='CustomerPhone')
                ALTER TABLE Orders ADD CustomerPhone nvarchar(20) NOT NULL DEFAULT N'';
        ");

        // Tạo bảng Blogs nếu chưa tồn tại
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Blogs')
            BEGIN
                CREATE TABLE Blogs (
                    Id           nvarchar(450) NOT NULL PRIMARY KEY,
                    Title        nvarchar(255) NOT NULL,
                    ShortDescription nvarchar(500) NULL,
                    Content      nvarchar(max) NOT NULL DEFAULT N'',
                    ImageUrl     nvarchar(max) NULL,
                    Author       nvarchar(100) NULL,
                    PublishDate  datetime2     NOT NULL DEFAULT GETDATE(),
                    IsActive     bit           NOT NULL DEFAULT 1
                );
            END
        ");

        // Tạo bảng Reviews nếu chưa tồn tại
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Reviews')
            BEGIN
                CREATE TABLE Reviews (
                    Id           int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    ProductId    int NOT NULL,
                    UserId       nvarchar(100) NOT NULL,
                    OrderId      int NULL,
                    Rating       int NOT NULL DEFAULT 5,
                    Comment      nvarchar(2000) NOT NULL DEFAULT N'',
                    CustomerName nvarchar(100) NOT NULL DEFAULT N'',
                    CreatedAt    datetime2 NOT NULL DEFAULT GETUTCDATE(),
                    CONSTRAINT FK_Reviews_Products FOREIGN KEY (ProductId)
                        REFERENCES Products(Id) ON DELETE CASCADE
                );
                CREATE INDEX IX_Reviews_ProductId ON Reviews(ProductId);
                CREATE INDEX IX_Reviews_UserId    ON Reviews(UserId);
            END
        ");

        // Unique index: mỗi đơn hàng chỉ được đánh giá một lần
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UIX_Reviews_OrderId' AND object_id = OBJECT_ID('Reviews'))
                CREATE UNIQUE INDEX UIX_Reviews_OrderId ON Reviews(OrderId) WHERE OrderId IS NOT NULL;
        ");

        Console.WriteLine("✅ Schema update: OK");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"⚠️  Schema update warning: {ex.Message}");
    }
}

// Ensure wwwroot/images exists for file uploads
var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(wwwrootPath, "images"));
app.Environment.WebRootPath = wwwrootPath;

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("BaseCore API Service running on port 5001");
Console.WriteLine("Endpoints: /api/products, /api/categories, /api/orders");
app.Run();
