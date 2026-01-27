import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { adminService } from '../services/authService';
import { FaArrowLeft, FaEye, FaDownload, FaSync, FaFilter, FaTimes, FaTrash } from 'react-icons/fa';

const MonitorEntregas = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Stats rápidas
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    draft: 0,
    byDriver: []
  });

  // Carrega entregas
  const loadDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getDeliveries(filters);
      const data = response.data.deliveries || [];
      setDeliveries(data);
      
      // Calcula stats
      const submitted = data.filter(d => d.status === 'submitted').length;
      const draft = data.filter(d => d.status === 'draft').length;
      setStats({
        total: data.length,
        submitted,
        draft,
        byDriver: [...new Set(data.map(d => d.userName))].length
      });

      setToast({ message: `Carregadas ${data.length} entregas`, type: 'success' });
    } catch (error) {
      console.error('Erro ao carregar:', error);
      setToast({ message: 'Erro ao carregar entregas', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Auto refresh
  useEffect(() => {
    loadDeliveries();
    
    if (autoRefresh) {
      const interval = setInterval(loadDeliveries, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [loadDeliveries, autoRefresh, refreshInterval]);

  // Aplica filtros locais
  useEffect(() => {
    let result = [...deliveries];

    if (filters.status !== 'all') {
      result = result.filter(d => d.status === filters.status);
    }

    setFilteredDeliveries(result);
  }, [deliveries, filters]);

  const handleDownload = async (deliveryId, documentType) => {
    try {
      const response = await adminService.downloadDocument(deliveryId, documentType);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'image/jpeg' }));
      const link = document.createElement('a');
      link.href = url;
      const delivery = deliveries.find(d => d._id === deliveryId);
      link.setAttribute('download', `${delivery?.deliveryNumber || 'doc'}_${documentType}.jpg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToast({ message: 'Documento baixado com sucesso', type: 'success' });
    } catch (error) {
      console.error('Erro ao baixar:', error);
      setToast({ message: 'Erro ao baixar arquivo: ' + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  const handleDelete = async (deliveryId) => {
    if (window.confirm('Tem certeza que deseja deletar esta entrega? Esta ação não pode ser desfeita.')) {
      try {
        await adminService.deleteDelivery(deliveryId);
        setToast({ message: 'Entrega deletada com sucesso', type: 'success' });
        setSelectedDelivery(null);
        loadDeliveries(); // Recarrega a tabela
      } catch (error) {
        setToast({ message: 'Erro ao deletar entrega', type: 'error' });
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      submitted: 'bg-green-100 text-green-800 border border-green-300',
      draft: 'bg-yellow-100 text-yellow-800 border border-yellow-300'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const documentLabels = {
    canhotNF: '📄 NF',
    canhotCTE: '📦 CTE',
    diarioBordo: '📓 Diário',
    devolucaoVazio: '🚛 Vazio',
    retiradaCheio: '🚚 Cheio'
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold transition"
          >
            <FaArrowLeft /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-800">📊 Monitor de Entregas</h1>
          <button
            onClick={loadDeliveries}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-semibold">Total</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-semibold">Entregues</p>
            <p className="text-3xl font-bold text-green-600">{stats.submitted}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-semibold">Rascunho</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.draft}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-semibold">Motoristas</p>
            <p className="text-3xl font-bold text-purple-600">{stats.byDriver}</p>
          </div>
        </div>

        {/* Auto Refresh Control */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-gray-700 font-semibold">Auto Atualizar</span>
            </label>
            
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <label className="text-gray-600 text-sm">A cada</label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  step="5"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-gray-300 rounded"
                />
                <span className="text-gray-600 text-sm">segundos</span>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-2">
              <FaFilter className="text-purple-600" />
              <span className="font-semibold text-gray-800">Filtros</span>
            </div>
            <span className="text-gray-500">{showFilters ? '▼' : '▶'}</span>
          </button>

          {showFilters && (
            <div className="border-t border-gray-200 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Todos</option>
                  <option value="submitted">Entregues</option>
                  <option value="draft">Rascunho</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Número, motorista, placa..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabela de Entregas */}
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">Nenhuma entrega encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Motorista
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Transportadora
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Data
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Documentos
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((delivery, index) => (
                  <tr
                    key={delivery._id}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {delivery.deliveryNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {delivery.userName}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-sm">
                      {delivery.vehiclePlate || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(delivery.status)}`}>
                        {delivery.status === 'submitted' ? '✓ Entregue' : '⏳ Rascunho'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(delivery.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {Object.keys(delivery.documents || {})
                          .filter(key => delivery.documents[key])
                          .map(docKey => (
                            <span
                              key={docKey}
                              title={documentLabels[docKey]}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                            >
                              ✓
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        <button
                          onClick={() => setSelectedDelivery(delivery)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                        >
                          <FaEye /> Visualizar
                        </button>
                        <button
                          onClick={() => handleDelete(delivery._id)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
                          title="Deletar entrega"
                        >
                          <FaTrash /> Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      {/* Modal Detalhes */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Entrega #{selectedDelivery.deliveryNumber}
              </h2>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-2xl hover:text-gray-200 transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Motorista</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {selectedDelivery.userName}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                  <p className="text-sm text-gray-700">{selectedDelivery.userEmail}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Transportadora</p>
                  <p className="text-lg font-mono font-semibold text-gray-800">
                    {selectedDelivery.vehiclePlate || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                      selectedDelivery.status
                    )}`}
                  >
                    {selectedDelivery.status === 'submitted' ? '✓ Entregue' : '⏳ Rascunho'}
                  </span>
                </div>
              </div>

              {selectedDelivery.observations && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Observações
                  </p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedDelivery.observations}
                  </p>
                </div>
              )}

              {/* Documentos */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Documentos Anexados
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {Object.keys(selectedDelivery.documents || {}).map(docKey => (
                    <div key={docKey}>
                      {selectedDelivery.documents[docKey] ? (
                        <div className="bg-gray-50 p-3 rounded flex items-center justify-between">
                          <span className="font-semibold text-gray-800">
                            {documentLabels[docKey]}
                          </span>
                          <button
                            onClick={() =>
                              handleDownload(selectedDelivery._id, docKey)
                            }
                            className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                          >
                            <FaDownload /> Baixar
                          </button>
                        </div>
                      ) : (
                        <div className="bg-gray-100 p-3 rounded text-gray-500 text-sm">
                          {documentLabels[docKey]} - Não anexado
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>
                  Criado em:{' '}
                  {new Date(selectedDelivery.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorEntregas;
