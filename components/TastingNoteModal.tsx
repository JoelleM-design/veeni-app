import React from 'react';
import TastingConfirmationModal from './TastingConfirmationModal';

interface TastingNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rating: number) => void;
  wineName: string;
}

export const TastingNoteModal: React.FC<TastingNoteModalProps> = ({
  visible,
  onClose,
  onSave,
  wineName,
}) => {
  return (
    <TastingConfirmationModal
      visible={visible}
      wineName={wineName}
      onCancel={onClose}
      onConfirm={onSave}
    />
  );
};