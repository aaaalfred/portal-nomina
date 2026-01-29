import { parseStringPromise } from 'xml2js';

export async function parseXML(xmlContent: string): Promise<{ rfc: string }> {
  try {
    const result = await parseStringPromise(xmlContent);
    
    // CFDI 3.3 / 4.0 structure
    const comprobante = result['cfdi:Comprobante'] || result.Comprobante;
    
    if (!comprobante) {
      throw new Error('Invalid CFDI structure');
    }

    // Extract RFC from Receptor
    const receptor = comprobante['cfdi:Receptor']?.[0] || comprobante.Receptor?.[0];
    const rfc = receptor?.$?.Rfc || receptor?.$?.rfc;

    if (!rfc) {
      throw new Error('RFC not found in XML');
    }

    return { rfc };
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error(`Failed to parse XML: ${error.message}`);
  }
}
