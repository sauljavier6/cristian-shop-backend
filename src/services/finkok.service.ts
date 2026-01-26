import { createClientAsync } from "soap";
import fs from "fs";
import path from "path";

const WSDL = "https://demo-facturacion.finkok.com/servicios/soap/stamp.wsdl";

const USER = process.env.FINKOK_USER!;
const PASS = process.env.FINKOK_PASS!;
const CSD_PASSWORD = process.env.CSD_PASSWORD!;

const CER_PATH = path.resolve("certs/test/csd.cer");
const KEY_PATH = path.resolve("certs/test/csd.key");

export async function timbrarXML(xml: string) {
  const client: any = await createClientAsync(WSDL);

  const cer = fs.readFileSync(CER_PATH).toString("base64");
  const key = fs.readFileSync(KEY_PATH).toString("base64");

  const params = {
    xml: Buffer.from(xml, "utf8").toString("base64"),
    username: USER,
    password: PASS,
    cer,
    key,
    passphrase: CSD_PASSWORD,
  };

  const [response] = await client.sign_stampAsync(params);
  const result = response?.sign_stampResult;

  if (!result) {
    throw new Error("Respuesta inválida de Finkok");
  }

  if (result.Incidencias?.Incidencia) {
    console.error("❌ Incidencia Finkok:", result.Incidencias.Incidencia);
    throw new Error(result.Incidencias.Incidencia.MensajeIncidencia);
  }

  return {
    uuid: result.UUID,
    xml: result.xml,
    codEstatus: result.CodEstatus
  };
}
