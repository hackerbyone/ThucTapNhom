using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository
{
    public class MySqlDbContext : DbContext
    {
        public MySqlDbContext(DbContextOptions<MySqlDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<Blog> Blogs { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<TankFishTracking> TankFishTrackings { get; set; }
        public DbSet<Accessory> Accessories { get; set; }
        public DbSet<InventoryCommit> InventoryCommits { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(e => e.UserName).HasMaxLength(50).IsRequired();
                entity.Property(e => e.Password).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.HasIndex(e => e.UserName).IsUnique();
            });

            // Category
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
            });

            // Product
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.CareInstructions).HasMaxLength(2000);
                entity.Property(e => e.Environment).HasMaxLength(1000);
                entity.Property(e => e.MaleStock).HasDefaultValue(0);
                entity.Property(e => e.FemaleStock).HasDefaultValue(0);
                entity.Property(e => e.ImageUrl).HasMaxLength(500);
                entity.HasOne(e => e.Category)
                      .WithMany()
                      .HasForeignKey(e => e.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Order
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
                entity.Property(e => e.DepositAmount).HasPrecision(18, 2);
                entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
                entity.Property(e => e.ShippingAddress).HasMaxLength(500);
                entity.Property(e => e.UserId).HasMaxLength(100).IsRequired();
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.Property(e => e.CustomerPhone).HasMaxLength(20);

                // ✅ Khai báo đúng WithMany → EF biết OrderDetails là collection của Order
                entity.HasMany(e => e.OrderDetails)
                      .WithOne(d => d.Order)
                      .HasForeignKey(d => d.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // OrderDetail
            modelBuilder.Entity<OrderDetail>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.Property(e => e.SelectedGender).HasMaxLength(20);

                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Cart
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).HasMaxLength(100).IsRequired();

                // ✅ Không dùng FK constraint sang User vì User.Id là string
                // chỉ cần lưu UserId như string thông thường
                entity.HasMany(e => e.Items)
                      .WithOne(i => i.Cart)
                      .HasForeignKey(i => i.CartId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Review
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).HasMaxLength(100).IsRequired();
                entity.Property(e => e.CustomerName).HasMaxLength(100);
                entity.Property(e => e.Comment).HasMaxLength(2000);
                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // CartItem
            modelBuilder.Entity<CartItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SelectedGender).HasMaxLength(20);
                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // TankFishTracking
            modelBuilder.Entity<TankFishTracking>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TankName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.LastUpdatedBy).HasMaxLength(100);
                entity.Property(e => e.LastUpdatedByName).HasMaxLength(100);
                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // Accessory
            modelBuilder.Entity<Accessory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
                entity.Property(e => e.Type).HasMaxLength(50);
                entity.Property(e => e.Unit).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.CreatedBy).HasMaxLength(100);
                entity.Property(e => e.CreatedByName).HasMaxLength(100);
                entity.HasOne(e => e.Product)
                      .WithMany()
                      .HasForeignKey(e => e.ProductId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // InventoryCommit
            modelBuilder.Entity<InventoryCommit>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.StaffId).HasMaxLength(100);
                entity.Property(e => e.StaffName).HasMaxLength(100);
                entity.Property(e => e.CommitMessage).HasMaxLength(500);
                entity.Property(e => e.TargetType).HasMaxLength(50);
                entity.Property(e => e.TargetName).HasMaxLength(200);
                entity.Property(e => e.OldValue).HasMaxLength(1000);
                entity.Property(e => e.NewValue).HasMaxLength(1000);
            });
        }
    }
}