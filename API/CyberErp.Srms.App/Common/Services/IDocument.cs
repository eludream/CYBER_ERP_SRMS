namespace CyberErp.Srms.App.Common.Services
{
    public interface IDocument 
    {
        string GetDocument(string? prefix, string? sufix, string documentNo, string? year, string? reference);
        public Task<string> GetNextDocumentNumber(string documentType,string? reference=null);
        public Task SetNetDocumentNumber(string documentType);

    }
}

