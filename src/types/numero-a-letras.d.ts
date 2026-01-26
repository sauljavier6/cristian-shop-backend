// src/types/numero-a-letras.d.ts
declare module "numero-a-letras" {
  interface NumeroALetrasOptions {
    plural?: string;
    singular?: string;
    centPlural?: string;
    centSingular?: string;
  }

  function numeroALetras(
    value: number | string,
    options?: NumeroALetrasOptions
  ): string;

  export default numeroALetras;
}
