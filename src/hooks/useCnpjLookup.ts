import { useState } from "react";
import { toast } from "sonner";

export interface CnpjData {
  razao_social: string;
  nome_fantasia: string;
  municipio: string;
  uf: string;
  cnae_fiscal_descricao: string;
  cnae_fiscal: number;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  email?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
}

export function useCnpjLookup() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CnpjData | null>(null);

  const lookup = async (cnpj: string, opts?: { silent?: boolean }) => {
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length !== 14) {
      if (!opts?.silent) toast.error("CNPJ deve ter 14 dígitos");
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
      if (!response.ok) {
        throw new Error("CNPJ não encontrado");
      }
      const result = (await response.json()) as CnpjData;
      setData(result);
      return result;
    } catch (error) {
      if (!opts?.silent) toast.error("Erro ao consultar CNPJ. Verifique o número.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { lookup, loading, data };
}
