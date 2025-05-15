"use client";

export default function TestStyles() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">Teste de Estilos</h1>
      <p className="text-lg text-gray-700 mb-4">Esta página testa se os estilos do Tailwind estão sendo aplicados corretamente.</p>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500 p-4 text-white rounded-lg">Vermelho</div>
        <div className="bg-blue-500 p-4 text-white rounded-lg">Azul</div>
        <div className="bg-green-500 p-4 text-white rounded-lg">Verde</div>
      </div>
      
      <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
        Botão de Teste
      </button>
    </div>
  );
} 