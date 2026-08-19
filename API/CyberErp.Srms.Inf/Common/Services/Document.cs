
using CyberErp.Srms.App.Common.Services;
using CyberErp.Srms.Inf.Models;
using Microsoft.EntityFrameworkCore;

namespace CyberErp.Srms.Inf.Common.Services
{
    internal class Document(SrmsDbContext context) : IDocument
    {
        private readonly SrmsDbContext _context = context;

        public async Task<string> GetNextDocumentNumber(string voucherType, string? reference)
        {
            var voucherNumber = "";
            var query = from setting in _context.DocumentSetting
                        where setting.VoucherType == voucherType
                        select setting;
            var objSetting = await query.FirstOrDefaultAsync() ??
                throw new Exception($"Document settings not found for voucher type: {voucherType}");

            var format = GetDocumentFormat(5);
            var currentNumber = string.Format(format, objSetting!.LastNumber);
            voucherNumber = GetDocument
                (objSetting.Prefix, objSetting.Sufix, currentNumber, objSetting.Year, reference);

            return voucherNumber!;

        }

        public async Task SetNetDocumentNumber(string voucherType)
        {
            var query = from setting in _context.DocumentSetting
                        where setting.VoucherType == voucherType
                        select setting;

            var objSetting = await query.FirstOrDefaultAsync() ??
               throw new Exception($"Document settings not found for voucher type: {voucherType}");

            objSetting.IncrementLastNumber();

            _context.SaveChanges();
        }

        public static string GetDocumentFormat(int numberOfDigits)
        {
            var format = "{0:";
            for (var i = 0; i < numberOfDigits; i++)
            {
                format += "0";
            }
            format += "}";
            return format;
        }
        public string GetDocument(string? prefix, string? sufix, string documentNo, string? year, string? reference)
        {
            string document = prefix != null && prefix != "" ? prefix + "-" + documentNo : documentNo;
            if (sufix != null && sufix != "")
                document = document + "-" + sufix;
            if (reference != null && reference != "")
                document = document + "-" + reference;

            if (year != null && year != "")
                document = document + "-" + year;

            return document;
        }

    }
}

