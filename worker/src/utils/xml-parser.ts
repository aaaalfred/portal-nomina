import { parseStringPromise } from 'xml2js';

export interface XMLData {
  rfc: string;
  nombre?: string;
  numEmpleado?: string;
}

export async function parseXML(xmlContent: string): Promise<XMLData> {
  try {
    const result = await parseStringPromise(xmlContent);
    
    // CFDI 3.3 / 4.0 structure
    const comprobante = result['cfdi:Comprobante'] || result.Comprobante;
    
    if (!comprobante) {
      throw new Error('Invalid CFDI structure');
    }

    // Extract RFC and Nombre from Receptor
    const receptor = comprobante['cfdi:Receptor']?.[0] || comprobante.Receptor?.[0];
    const rfc = receptor?.$?.Rfc || receptor?.$?.rfc;
    const nombre = receptor?.$?.Nombre || receptor?.$?.nombre;

    if (!rfc) {
      throw new Error('RFC not found in XML');
    }

    // Extract NumEmpleado from Nomina complement
    let numEmpleado: string | undefined;
    try {
      const complemento = comprobante['cfdi:Complemento']?.[0] || comprobante.Complemento?.[0];
      const nomina = complemento['nomina12:Nomina']?.[0] || complemento.Nomina?.[0];
      const receptorNomina = nomina['nomina12:Receptor']?.[0] || nomina.Receptor?.[0];
      numEmpleado = receptorNomina?.$?.NumEmpleado || receptorNomina?.$?.numEmpleado;
    } catch {
      // NumEmpleado is optional
    }

    return { rfc, nombre, numEmpleado };
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error(`Failed to parse XML: ${error.message}`);
  }
}
