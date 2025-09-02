// services/paydunya.js
const axios = require('axios');
const config = require('../config/config');
require('dotenv').config();

const Transaction = require('../models/transaction');

// Infos statiques
const STATIC_INFO = {
  description: 'Paiement d’un service mobile money',
  storeName: 'Service Mobile Money',
  email: 'mathiasattikpo@gmail.com',
  callbackUrl: process.env.CALLBACK_URL || config.callbackUrl,
};

const processInvoiceAndPayment = async (payload) => {
  try {
    if (!payload.amount || !payload.payment_mode || !payload.name || !payload.phone_number || !payload.article_id) {
      return { success: false, error: 'Données manquantes ou invalides' };
    }

    const invoicePayload = {
      invoice: {
        total_amount: payload.amount,
        description: STATIC_INFO.description,
      },
      store: {
        name: STATIC_INFO.storeName,
      },
      actions: {
        callback_url: STATIC_INFO.callbackUrl,
      },
      custom_data: {
        article_id: payload.article_id
      }
    };

    let invoiceResponse;
    try {
      invoiceResponse = await axios.post(
        `${config.paydunyaApiUrl}/v1/checkout-invoice/create`,
        invoicePayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'PAYDUNYA-MASTER-KEY': config.masterKey,
            'PAYDUNYA-PRIVATE-KEY': config.privateKey,
            'PAYDUNYA-TOKEN': config.token,
          },
        }
      );
    } catch (error) {
      console.error('Erreur API PayDunya (facture) :', error.response?.data || error.message);
      return { success: false, error: 'Erreur lors de la création de la facture' };
    }

    if (invoiceResponse.data.response_code !== '00') {
      return { success: false, error: 'Erreur lors de la création de la facture' };
    }

    const invoiceToken = invoiceResponse.data.token;
    const emailToUse = payload.email || STATIC_INFO.email;

    try {
      const transactionRecord = await Transaction.create({
        type: 'payment',
        status: 'pending',
        token: invoiceToken,
        amount: payload.amount,
        mode: payload.payment_mode,
        customer: {
          name: payload.name,
          phone: payload.phone_number,
        },
        created_at: new Date(),
        article_id: payload.article_id,
      });

      if (!transactionRecord) {
        console.error('Erreur lors de l\'enregistrement dans la collection Transaction');
        return { success: false, error: 'Erreur lors de l\'enregistrement dans Transaction' };
      }

      console.log(`Enregistrement de la transaction effectué : ${invoiceToken}`);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement dans la collection Transaction:', error.message);
      return { success: false, error: 'Erreur lors de l\'enregistrement dans Transaction' };
    }

    let paymentResponse;

    switch (payload.payment_mode) {
      case 'tmoney':
        paymentResponse = await axios.post(
          `${config.paydunyaApiUrl}/v1/softpay/t-money-togo`,
          {
            name_t_money: payload.name,
            email_t_money: emailToUse,
            phone_t_money: payload.phone_number,
            payment_token: invoiceToken,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        break;

      case 'moov':
        paymentResponse = await axios.post(
          `${config.paydunyaApiUrl}/v1/softpay/moov-togo`,
          {
            moov_togo_customer_fullname: payload.name,
            moov_togo_email: emailToUse,
            moov_togo_customer_address: payload.address || 'Adresse inconnue',
            moov_togo_phone_number: payload.phone_number,
            payment_token: invoiceToken,
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        break;

      default:
        return { success: false, error: 'Mode de paiement non pris en charge' };
    }

    return {
      success: paymentResponse.data.success,
      data: paymentResponse.data,
      token: invoiceToken,
    };
  } catch (error) {
    console.error('Erreur API PayDunya:', error.response?.data || error.message);
    return { success: false, error: 'Erreur interne du serveur' };
  }
};

module.exports = { processInvoiceAndPayment };
