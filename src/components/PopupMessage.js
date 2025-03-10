import React from 'react';

const PopupMessage = ({ isOpen, onClose, message, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-xl">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <p
          className="text-gray-300 mb-6"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <button
          onClick={onClose}
          className="w-full bg-white text-black font-bold py-2 rounded-xl hover:bg-gray-200 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PopupMessage;