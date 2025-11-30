import { supabase, getCurrentUser } from '../lib/supabaseClient';

// BUSCAR as lavouras do usuário logado
export async function getUserCrops() {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('crops')
    .select('*')
    .eq('user_id', user.id); // 🔴 FILTRO POR DONO

  if (error) {
    console.error('Erro ao buscar lavouras:', error);
    throw error;
  }

  return data;
}

// CRIAR uma nova lavoura para o usuário logado
export async function createCrop(cropData: {
  name: string;
  area?: number;
  // coloque aqui os outros campos que sua tabela tiver
}) {
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from('crops')
    .insert({
      user_id: user.id,   // 🔴 AMARRA A LAVOURA AO DONO
      ...cropData,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar lavoura:', error);
    throw error;
  }

  return data;
}
