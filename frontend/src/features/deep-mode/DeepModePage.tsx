import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeepModeWall } from './DeepModeWall';

export const DeepModePage = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <DeepModeWall
      open={open}
      onClose={() => {
        setOpen(false);
        navigate('/');
      }}
    />
  );
};
