
using CyberErp.Srms.App.Common.DTOs;
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Dom.Constants;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;


namespace CyberErp.Srms.Inf.Common.Services
{
    public class UploadFile : IUploadFile
    {
        private readonly string _basePath;

        public UploadFile(IConfiguration configuration)
        {
            _basePath = configuration.GetValue<string>("FileStorage:BasePath")
                ?? throw new InvalidOperationException("FileStorage:BasePath configuration is required.");
        }

        public void Dispose()
        {
            //throw new NotImplementedException();
        }

        public string GetFileName(IFormFile file, FilePath filePath)
        {
            FileInfo fileInfo = new FileInfo(file.FileName);
            string fileName = filePath.FileName + fileInfo.Extension;
            return fileName;
        }

        public string Upload(IFormFile file, FilePath filePath)
        {
            var folderName = "";
            if (filePath.Folder != null)
                folderName = Path.Combine(filePath.Path + "/" + filePath.Folder);
            else
                folderName = filePath.Path;

            var path = Path.Combine(_basePath, folderName);

            //create folder if not exist
            if (!Directory.Exists(path))
                Directory.CreateDirectory(path);

            //get file extension
            FileInfo fileInfo = new FileInfo(file.FileName);
            string fileName = filePath.FileName + fileInfo.Extension;
            if (!AllowedFileType.AllowedExtensions.Contains(fileInfo.Extension))
            {
                throw new Exception("Unsupported file type.");
            }
            string fileNameWithPath = Path.Combine(path, fileName);

            using (var stream = new FileStream(fileNameWithPath, FileMode.Create))
            {
                file.CopyTo(stream);
            }
            return fileName;
        }

        public void DeleteFile(FilePath filePath)
        {
            var folderName = "";
            if (filePath.Folder != null)
                folderName = Path.Combine(filePath.Path + "/" + filePath.Folder);
            else
                folderName = filePath.Path;
            var path = Path.Combine(_basePath, folderName);
            var file = path + "/" + (filePath.FileName == null ? "a" : filePath.FileName);
            if (filePath.FileName != null && File.Exists(file))
                File.Delete(file);
        }
    }
}

