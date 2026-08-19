
using CyberErp.Srms.App.Common.DTOs;
using Microsoft.AspNetCore.Http;

namespace CyberErp.Srms.App.Common.Services
{
    public interface IUploadFile : IDisposable
    {
        public string Upload(IFormFile file, FilePath filePath);
        public string GetFileName(IFormFile file, FilePath filePath);
        public void DeleteFile( FilePath filePath);


    }
}

