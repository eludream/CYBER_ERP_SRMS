namespace CyberErp.Srms.Dom.Constants
{
    public class SettingKeyDefinition
    {
        public string Name { get; }
        public string Type { get; }

        public SettingKeyDefinition(string name, string type)
        {
            Name = name;
            Type = type;
        }
    }

    public static class SettingKeys
    {
        public static SettingKeyDefinition BatchManagement { get; } = new("BatchManagement", SettingTypes.Inventory);
        public static SettingKeyDefinition DefaultCustomer { get; } = new("DefaultCustomer", SettingTypes.Sales);
        public static SettingKeyDefinition DefaultSupplier { get; } = new("DefaultSupplier", SettingTypes.Purchase);
        public static SettingKeyDefinition DefaultSalesPerson { get; } = new("DefaultSalesPerson", SettingTypes.Sales);
        public static SettingKeyDefinition DefaultStore { get; } = new("DefaultStore", SettingTypes.Inventory);
        public static SettingKeyDefinition DefaultWarehouse { get; } = new("DefaultWarehouse", SettingTypes.Inventory);
        public static SettingKeyDefinition Currency { get; } = new("Currency", SettingTypes.General);
        public static SettingKeyDefinition DecimalPlaces { get; } = new("DecimalPlaces", SettingTypes.General);
        public static SettingKeyDefinition DateFormat { get; } = new("DateFormat", SettingTypes.General);
        public static SettingKeyDefinition AllowNegativeBankTransaction { get; } = new("AllowNegativeBankTransaction", SettingTypes.Finance);
        public static SettingKeyDefinition EnableBank { get; } = new("EnableBank", SettingTypes.Sales);
        public static SettingKeyDefinition DefaultBank { get; } = new("DefaultBank", SettingTypes.Finance);
        public static SettingKeyDefinition EnableBankPurchase { get; } = new("EnableBankPurchase", SettingTypes.Purchase);
        public static SettingKeyDefinition EnableBankFinance { get; } = new("EnableBankFinance", SettingTypes.Finance);
    }

    public static class SettingTypes
    {
        public const string Sales = "Sales";
        public const string Purchase = "Purchase";
        public const string Inventory = "Inventory";
        public const string Finance = "Finance";
        public const string General = "General";
    }
}

