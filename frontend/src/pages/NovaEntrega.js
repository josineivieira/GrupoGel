import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { deliveryService } from '../services/authService';
import DocumentUpload from '../components/DocumentUpload';
import Toast from '../components/Toast';
import { FaArrowLeft, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';

const NovaEntrega = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: deliveryId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [formData, setFormData] = useState({
    deliveryNumber: '',
    vehiclePlate: '',
    observations: '',
    driverName: ''
  });
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const documentLabels = {
    canhotNF: '📄 Canhoto NF',
    canhotCTE: '📦 Canhoto CTE',
    diarioBordo: '📓 Diário de Bordo',
    devolucaoVazio: '🚛 Devolução Vazio',
    retiradaCheio: '🚚 Retirada Cheio'
  };

  useEffect(() => {
    if (deliveryId) {
      loadDelivery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryId]);

  const loadDelivery = async () => {
    try {
      const response = await deliveryService.getDelivery(deliveryId);
      if (response.data && response.data.delivery) {
        const delivery = response.data.delivery;

        // Garantir que documents está inicializado
        if (!delivery.documents) {
          delivery.documents = {
            canhotNF: null,
            canhotCTE: null,
            diarioBordo: null,
            devolucaoVazio: null,
            retiradaCheio: null
          };
        }

        setDelivery(delivery);
        setFormData({
          deliveryNumber: delivery.deliveryNumber || '',
          vehiclePlate: delivery.vehiclePlate || '',
          observations: delivery.observations || '',
          driverName: delivery.driverName || ''
        });
        setSubmitted(delivery.status === 'submitted');
      }
    } catch (error) {
      console.error('Erro ao carregar entrega:', error);
      setToast({
        message:
          'Erro ao carregar entrega: ' +
          (error.response?.data?.message || error.message),
        type: 'error'
      });
    }
  };

  const handleInputChange = (e) => {
    if (!deliveryId) {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleCreateDelivery = async () => {
    if (!formData.deliveryNumber.trim()) {
      setToast({ message: 'Número da entrega é obrigatório', type: 'error' });
      return;
    }

    console.log('📦 Criando entrega com dados:', formData);

    try {
      const response = await deliveryService.createDelivery(formData);
      const newDelivery = response.data.delivery;

      // Garantir que documents existe
      if (!newDelivery.documents) {
        newDelivery.documents = {
          canhotNF: null,
          canhotCTE: null,
          diarioBordo: null,
          devolucaoVazio: null,
          retiradaCheio: null
        };
      }

      setDelivery(newDelivery);
      setToast({ message: 'Entrega criada com sucesso', type: 'success' });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Erro ao criar entrega',
        type: 'error'
      });
    }
  };

  const handleDocumentUpload = async (documentType, file) => {
    if (!delivery) {
      setToast({ message: 'Crie a entrega primeiro', type: 'error' });
      return;
    }

    setUploadingDoc(documentType);

    try {
      const response = await deliveryService.uploadDocument(
        delivery._id,
        documentType,
        file
      );

      if (response.data && response.data.delivery) {
        const updatedDelivery = response.data.delivery;

        if (!updatedDelivery.documents) {
          updatedDelivery.documents = {
            canhotNF: null,
            canhotCTE: null,
            diarioBordo: null,
            devolucaoVazio: null,
            retiradaCheio: null
          };
        }

        setDelivery(updatedDelivery);
      }

      setToast({ message: '✅ Documento anexado com sucesso', type: 'success' });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setToast({
        message:
          'Erro ao enviar documento: ' +
          (error.response?.data?.message || error.message),
        type: 'error'
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmit = async () => {
    setLoadingSubmit(true);

    try {
      await deliveryService.submitDelivery(delivery._id);
      setSubmitted(true);
      setToast({ message: '✅ Enviado com sucesso!', type: 'success' });
      setTimeout(() => navigate('/minhas-entregas'), 2000);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Erro ao enviar',
        type: 'error'
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const allDocsUploaded =
    delivery?.documents &&
    Object.keys(documentLabels).every((key) => !!delivery.documents[key]);

  return (
    // ✅ sem min-h-screen e sem Header: AppLayout controla altura/scroll
    <div className="bg-gray-100">
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold mb-6 transition"
        >
          <FaArrowLeft />
          Voltar
        </button>

        {!delivery ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Informações da Entrega
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data (automática)
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('pt-BR')}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contratado (automático)
                </label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome do Motorista *
                </label>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-base"
                  placeholder="DIGITE O NOME DO MOTORISTA"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número do Container *
                </label>
                <input
  type="text"
  name="deliveryNumber"
  value={formData.deliveryNumber}
  onChange={(e) =>
    setFormData({
      ...formData,
      deliveryNumber: e.target.value.toUpperCase()
    })
  }
  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-base uppercase"
  placeholder="DIGITE O NÚMERO DO CONTAINER"
  required
/>

              </div>



              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none text-base"
                  placeholder="Digite observações da entrega"
                  rows={3}
                />
              </div>

              <button
                onClick={handleCreateDelivery}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition text-lg shadow-md"
              >
                Continuar para Documentos
              </button>
            </div>
          </div>
        ) : (
          <div>
            {submitted ? (
              <div className="bg-green-100 border-l-4 border-green-500 p-6 rounded-lg text-center">
                <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  Enviado com Sucesso!
                </h2>
                <p className="text-green-700 mb-4">
                  Sua entrega foi registrada no sistema
                </p>
                <button
                  onClick={() => navigate('/minhas-entregas')}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  Ver Minhas Entregas
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-lg text-blue-900 mb-3">
                    Resumo da Entrega
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Nº do Container</p>
                      <p className="font-bold text-blue-900">
                        {delivery.deliveryNumber}
                      </p>
                    </div>
                    {delivery.vehiclePlate && (
                      <div>
                        <p className="text-blue-700">Transportadora</p>
                        <p className="font-bold text-blue-900">
                          {delivery.vehiclePlate}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Documentos Obrigatórios
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Anexe as fotos dos 5 documentos obrigatórios:
                  </p>

                  <div className="space-y-3">
                    {Object.entries(documentLabels).map(([key, label]) => (
                      <DocumentUpload
                        key={key}
                        documentType={key}
                        label={label}
                        onFileSelect={(file) => handleDocumentUpload(key, file)}
                        isUploaded={!!(delivery?.documents && delivery.documents[key])}
                        isLoading={uploadingDoc === key}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={loadingSubmit || !allDocsUploaded}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-4 px-6 rounded-lg transition text-lg flex items-center justify-center gap-2 shadow-md"
                >
                  <FaPaperPlane />
                  {loadingSubmit ? 'Enviando...' : 'Finalizar e Enviar'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default NovaEntrega;
