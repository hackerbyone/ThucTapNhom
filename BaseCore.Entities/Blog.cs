using System;
using System.ComponentModel.DataAnnotations;

public class Blog
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString(); 

    [Required]
    [MaxLength(255)]
    public string Title { get; set; }

    [MaxLength(500)]
    public string ShortDescription { get; set; } 

    [Required]
    public string Content { get; set; }

    public string ImageUrl { get; set; }

    [MaxLength(100)]
    public string Author { get; set; }

    public DateTime PublishDate { get; set; } = DateTime.Now;

    public bool IsActive { get; set; } = true;
}