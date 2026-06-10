using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BaseCore.Repository;
using BaseCore.Repository.EFCore;
using System.Text;
using BaseCore.Services;
using BaseCore.APIService.Services;


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
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IVnPayService, VnPayService>();

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
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='PairPrice')
                ALTER TABLE Products ADD PairPrice decimal(18,2) NULL;
        ");

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

        // Bảng TankFishTrackings
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='TankFishTrackings')
            BEGIN
                CREATE TABLE TankFishTrackings (
                    Id              int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    TankName        nvarchar(100) NOT NULL,
                    ProductId       int NOT NULL,
                    MaleCount       int NOT NULL DEFAULT 0,
                    FemaleCount     int NOT NULL DEFAULT 0,
                    Notes           nvarchar(1000) NULL,
                    LastUpdated     datetime2 NOT NULL DEFAULT GETDATE(),
                    LastUpdatedBy   nvarchar(100) NOT NULL DEFAULT N'',
                    LastUpdatedByName nvarchar(100) NOT NULL DEFAULT N'',
                    CONSTRAINT FK_TankFishTrackings_Products FOREIGN KEY (ProductId)
                        REFERENCES Products(Id) ON DELETE NO ACTION
                );
                CREATE INDEX IX_TankFishTrackings_ProductId ON TankFishTrackings(ProductId);
            END
        ");

        // Bảng Accessories
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='Accessories')
            BEGIN
                CREATE TABLE Accessories (
                    Id           int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    Name         nvarchar(200) NOT NULL,
                    Type         nvarchar(50) NOT NULL DEFAULT N'Accessory',
                    Quantity     int NOT NULL DEFAULT 0,
                    Unit         nvarchar(50) NULL,
                    Status       nvarchar(50) NOT NULL DEFAULT N'Good',
                    Description  nvarchar(1000) NULL,
                    IsActive     bit NOT NULL DEFAULT 1,
                    Created      datetime2 NOT NULL DEFAULT GETDATE(),
                    Modified     datetime2 NULL,
                    CreatedBy    nvarchar(100) NOT NULL DEFAULT N'',
                    CreatedByName nvarchar(100) NOT NULL DEFAULT N''
                );
            END
        ");

        // Bảng InventoryCommits
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='InventoryCommits')
            BEGIN
                CREATE TABLE InventoryCommits (
                    Id            int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    StaffId       nvarchar(100) NOT NULL DEFAULT N'',
                    StaffName     nvarchar(100) NOT NULL DEFAULT N'',
                    CommitMessage nvarchar(500) NOT NULL DEFAULT N'',
                    TargetType    nvarchar(50) NOT NULL DEFAULT N'',
                    TargetId      int NULL,
                    TargetName    nvarchar(200) NOT NULL DEFAULT N'',
                    OldValue      nvarchar(1000) NULL,
                    NewValue      nvarchar(1000) NULL,
                    Created       datetime2 NOT NULL DEFAULT GETDATE()
                );
                CREATE INDEX IX_InventoryCommits_StaffId ON InventoryCommits(StaffId);
                CREATE INDEX IX_InventoryCommits_Created ON InventoryCommits(Created DESC);
            END
        ");

        // Thêm cột ProductId vào Accessories (nullable FK → Products)
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Accessories' AND COLUMN_NAME='ProductId')
                ALTER TABLE Accessories ADD ProductId int NULL;
        ");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name='FK_Accessories_Products')
                ALTER TABLE Accessories ADD CONSTRAINT FK_Accessories_Products
                    FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE SET NULL;
        ");
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UIX_Accessories_ProductId' AND object_id=OBJECT_ID('Accessories'))
                CREATE UNIQUE INDEX UIX_Accessories_ProductId ON Accessories(ProductId) WHERE ProductId IS NOT NULL AND IsActive = 1;
        ");

        // Thêm UserType 3 = Warehouse nếu cần (chỉ cần về schema, không cần migration riêng)
        // UserType trong Users đã là int - không cần thay đổi bảng

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
