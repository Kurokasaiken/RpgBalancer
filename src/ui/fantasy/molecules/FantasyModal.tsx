import React from 'react';
import { FantasyCard } from '../atoms/FantasyCard';
import { FantasyButton } from '../atoms/FantasyButton';

interface FantasyModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const FantasyModal: React.FC<FantasyModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="max-w-lg w-full animate-in fade-in zoom-in duration-200">
                <FantasyCard title={title} className="shadow-[var(--shadow-fantasy-float)] border-4 border-[var(--fantasy-bg-wood-light)]">
                    <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {children}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <FantasyButton onClick={onClose} variant="primary">
                            Close
                        </FantasyButton>
                    </div>
                </FantasyCard>
            </div>
        </div>
    );
};
