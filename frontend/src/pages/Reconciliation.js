import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { adminService } from '../services/authService';
import { FaArrowLeft, FaUpload, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

const Reconciliation = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedUpdates, setSelectedUpdates] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setToast({ message: 'Selecione um arquivo', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Enviando arquivo:', file.name);
      const response = await adminService.uploadReconciliation(file);
      console.log('✅ Resposta:', response.data);
      setResults(response.data.results);
      
      // Pré-seleciona todos os itens com status diferente para atualização
      if (response.data.results.statusDiff) {
        setSelectedUpdates(response.data.results.statusDiff.map(item => item.deliveryNumber));
      }
      
      setToast({ message: 'Arquivo processado com sucesso', type: 'success' });
      setFile(null);
    } catch (error) {
      console.error('Erro:', error);
      setToast({ 
        message: error.response?.data?.message || 'Erro ao processar arquivo', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyUpdates = async () => {
    if (selectedUpdates.length === 0) {
      setToast({ message: 'Nenhuma entrega selecionada para atualizar', type: 'error' });
      return;
    }

    const updates = results.statusDiff
      .filter(item => selectedUpdates.includes(item.deliveryNumber))
      .map(item => ({
        deliveryNumber: item.deliveryNumber,
        newStatus: item.normalizedStatus
      }));

    setLoading(true);
    try {
      console.log('🔄 Aplicando atualizações:', updates.length);
      const response = await adminService.applyReconciliation(updates);
      console.log('✅ Resultado:', response.data);
      setToast({ message: `${updates.length} entregas atualizadas com sucesso`, type: 'success' });
      setResults(null);
      setSelectedUpdates([]);
    } catch (error) {
      console.error('Erro:', error);
      setToast({ 
        message: error.response?.data?.message || 'Erro ao aplicar atualizações', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUpdate = (deliveryNumber) => {
    setSelectedUpdates(prev => 
      prev.includes(deliveryNumber)
        ? prev.filter(d => d !== deliveryNumber)
        : [...prev, deliveryNumber]
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-6xl mx-auto p-4">
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold mb-6 transition"
        >
          <FaArrowLeft /> Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Reconciliação de Dados</h1>

        {/* Upload Section */}
        {!results && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upload de Planilha</h2>
            <p className="text-gray-600 text-sm mb-4">
              Faça upload de um arquivo CSV com as colunas: <strong>Número</strong> (ou Número Entrega) e <strong>Status</strong>
            </p>
            
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileChange}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
              />
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
              >
                <FaUpload /> {loading ? 'Processando...' : 'Enviar'}
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <p className="text-gray-600 text-sm font-semibold">OK (sem mudança)</p>
                <p className="text-3xl font-bold text-green-600">{results.found.length}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <p className="text-gray-600 text-sm font-semibold">Status Diferente</p>
                <p className="text-3xl font-bold text-blue-600">{results.statusDiff.length}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                <p className="text-gray-600 text-sm font-semibold">Não Encontradas</p>
                <p className="text-3xl font-bold text-red-600">{results.notFound.length}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                <p className="text-gray-600 text-sm font-semibold">Selecionadas</p>
                <p className="text-3xl font-bold text-purple-600">{selectedUpdates.length}</p>
              </div>
            </div>

            {/* Status Different - Requires Update */}
            {results.statusDiff.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaSync className="text-blue-500" /> Entregas com Status Diferente ({results.statusDiff.length})
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUpdates.length === results.statusDiff.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUpdates(results.statusDiff.map(d => d.deliveryNumber));
                              } else {
                                setSelectedUpdates([]);
                              }
                            }}
                            className="w-4 h-4"
                          />
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Número</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Contratado</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status Sistema</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status Planilha</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Novo Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.statusDiff.map((item) => (
                        <tr key={item.deliveryNumber} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUpdates.includes(item.deliveryNumber)}
                              onChange={() => toggleUpdate(item.deliveryNumber)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.deliveryNumber}</td>
                          <td className="px-4 py-3 text-gray-700">{item.userName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                              {item.systemStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                              {item.uploadedStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                              {item.normalizedStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleApplyUpdates}
                    disabled={selectedUpdates.length === 0 || loading}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition font-semibold"
                  >
                    <FaCheck /> Aplicar Atualizações ({selectedUpdates.length})
                  </button>
                  <button
                    onClick={() => { setResults(null); setSelectedUpdates([]); }}
                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Not Found */}
            {results.notFound.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaTimes className="text-red-500" /> Não Encontradas ({results.notFound.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Número</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status Planilha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.notFound.map((item) => (
                        <tr key={item.deliveryNumber} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.deliveryNumber}</td>
                          <td className="px-4 py-3 text-gray-700">{item.uploadedStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* OK Items */}
            {results.found.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaCheck className="text-green-500" /> Sem Mudanças ({results.found.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Número</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.found.map((item) => (
                        <tr key={item.deliveryNumber} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.deliveryNumber}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Reconciliation;
