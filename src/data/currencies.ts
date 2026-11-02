export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  countryCode: string;
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", countryCode: "US" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", countryCode: "EU" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", countryCode: "GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", countryCode: "JP" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", countryCode: "CN" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", countryCode: "IN" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦", countryCode: "CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", countryCode: "AU" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", flag: "🇨🇭", countryCode: "CH" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬", countryCode: "NG" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷", countryCode: "BR" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺", countryCode: "RU" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷", countryCode: "KR" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", countryCode: "ZA" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪", countryCode: "SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴", countryCode: "NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰", countryCode: "DK" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", countryCode: "SG" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰", countryCode: "HK" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿", countryCode: "NZ" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽", countryCode: "MX" },
  { code: "ARS", name: "Argentine Peso", symbol: "$", flag: "🇦🇷", countryCode: "AR" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷", countryCode: "TR" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪", countryCode: "AE" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦", countryCode: "SA" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩", countryCode: "ID" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾", countryCode: "MY" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭", countryCode: "TH" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭", countryCode: "PH" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳", countryCode: "VN" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱", countryCode: "PL" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺", countryCode: "HU" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿", countryCode: "CZ" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪", flag: "🇮🇱", countryCode: "IL" },
  { code: "CLP", name: "Chilean Peso", symbol: "$", flag: "🇨🇱", countryCode: "CL" },
  { code: "COP", name: "Colombian Peso", symbol: "$", flag: "🇨🇴", countryCode: "CO" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬", countryCode: "EG" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪", countryCode: "KE" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", flag: "🇬🇭", countryCode: "GH" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$", flag: "🇹🇼", countryCode: "TW" },
];
