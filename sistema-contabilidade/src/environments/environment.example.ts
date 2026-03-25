// =====================================================================
// EXEMPLO de configuração — copie este arquivo para environment.ts
// e preencha com suas credenciais reais (que NÃO devem ir ao git).
// =====================================================================
export const environment = {
  production: false,

  // Usuários com acesso ao sistema
  usuarios: [
    { login: 'admin', senha: 'TROQUE_AQUI', nome: 'Administrador' },
  ],

  // Credenciais do EmailJS — https://www.emailjs.com/
  emailjs: {
    serviceId:  'SEU_SERVICE_ID',
    templateId: 'SEU_TEMPLATE_ID',
    publicKey:  'SUA_PUBLIC_KEY',
  },
};
