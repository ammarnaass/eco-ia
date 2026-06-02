const { encrypt, decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');
const supabase = require('../lib/supabase');

async function createAccount({ phone_number_id, waba_id, access_token, verify_token, label }) {
  const { data, error } = await supabase.from('whatsapp_accounts').insert({
    phone_number_id,
    waba_id: waba_id || '',
    label: label || 'Default',
    access_token: encrypt(access_token),
    verify_token: encrypt(verify_token),
  }).select('id, phone_number_id, waba_id, label, created_at').single();

  if (error) { logger.error(`whatsapp_store.createAccount: ${error.message}`); throw error; }
  logger.info(`WhatsApp account created: ${data.id} (${label || phone_number_id})`);
  return { ...data, access_token: '••••••', verify_token: '••••••' };
}

async function getAccount(id) {
  const { data, error } = await supabase.from('whatsapp_accounts').select('*').eq('id', id).single();
  if (error || !data) return null;
  return {
    ...data,
    access_token: decrypt(data.access_token),
    verify_token: decrypt(data.verify_token),
  };
}

async function listAccounts() {
  const { data, error } = await supabase.from('whatsapp_accounts').select('id, phone_number_id, waba_id, label, created_at').order('created_at', { ascending: false });
  if (error) return [];
  return data.map(a => ({ ...a, access_token: '••••••', verify_token: '••••••' }));
}

async function deleteAccount(id) {
  const { error } = await supabase.from('whatsapp_accounts').delete().eq('id', id);
  if (error) { logger.error(`whatsapp_store.deleteAccount: ${error.message}`); return false; }
  logger.info(`WhatsApp account deleted: ${id}`);
  return true;
}

async function findAccountByVerifyToken(token) {
  const { data, error } = await supabase.from('whatsapp_accounts').select('*');
  if (error || !data) return null;
  
  for (const account of data) {
    try {
      const decrypted = decrypt(account.verify_token);
      if (decrypted === token) {
        return {
          ...account,
          access_token: decrypt(account.access_token),
          verify_token: decrypted,
        };
      }
    } catch (e) {
      logger.error(`Error decrypting verify_token for account ${account.id}: ${e.message}`);
    }
  }
  return null;
}

async function getDefaultAccount() {
  const { data, error } = await supabase.from('whatsapp_accounts').select('*').order('created_at', { ascending: true }).limit(1).maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    access_token: decrypt(data.access_token),
    verify_token: decrypt(data.verify_token),
  };
}

module.exports = { createAccount, getAccount, listAccounts, deleteAccount, findAccountByVerifyToken, getDefaultAccount };
