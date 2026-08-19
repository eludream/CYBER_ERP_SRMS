namespace CyberErp.Srms.App.Common.DTOs
{
    public class PaginatedResponse<T>
    {
        public int Total { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }
        public IEnumerable<T> Data { get; set; } = new List<T>();
    }
}
