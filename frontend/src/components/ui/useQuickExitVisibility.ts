import { useContext } from 'react';
import { AuthContext } from '../../context/authContextInstance';

export function useQuickExitVisibility() {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  return user?.tipoUsuario !== 'VOLUNTARIO'
    && user?.tipoBeneficiario !== 'CRIANCA_ADOLESCENTE';
}
