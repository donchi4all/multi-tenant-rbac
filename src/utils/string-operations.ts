
// import cryptoRandomString from 'crypto-random-string';

export default class StringsFormating {
  public static snakeToCamel(str: string): string {
    return str.replace(
      /([-_][a-z])/g,
      (group) => group.toUpperCase().replace('-', '').replace('_', '')
    );
  }

  public static toSlugCaseWithUnderscores(str: string) {
    return str.toLowerCase().trim().replace(/ /g, '_').replace(/[\s_-]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
  }
  
  public static ucfirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  public static toSlugCase(str: string): string {
    return str.replace(/ /g, '-').replace(/[^\w-]+/g, '').toLowerCase();
  }

  public static toSentenceCase(str: string): string {
    return str.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  }

  public static toCamelCase(str: string): string {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
  }

  // public static randomString(length: number = 6): string {
  //   return cryptoRandomString({ length });
  // }

  public static toBool(value: string): boolean {
    return value === 'true';
  }
}
