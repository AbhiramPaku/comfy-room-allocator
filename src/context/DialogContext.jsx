
import { createContext, useContext, useState } from 'react';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  return (
    <DialogContext.Provider value={{ isDialogOpen, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
};
