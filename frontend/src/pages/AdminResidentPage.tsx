import {type FormEvent, useState, useEffect} from 'react';
import Navbar from '../components/Navbar';
import {useAuth} from '../context/AuthContext';
import {createResident, getManagingResidents, type ResidentInput} from '../api/Residents';
import type {Resident} from '../types/Resident';



const emptyResident: ResidentInput = {
  caseControlNo: '',
  internalCode: '',
  safehouseId: 0,
  caseStatus: '',
  sex: '',
  dateOfBirth: '',
  birthStatus: '',
  placeOfBirth: '',
};

function AdminResidentPage() {
  const {authSession, isLoading} = useAuth();
  const isAdmin = (authSession?.roles ?? []).includes('Admin');
  const [resident, setResident] = useState<Resident[]>([]);
  const [formState, setFormState] = useState<ResidentInput>(emptyResident);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (!isLoading && isAdmin) {
        void loadResidents();
    }
}, [isAdmin, isLoading]);

async function loadResidents() {
    try {
        const data = await getManagingResidents();
        setResident(data);
    } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load residents');
    }
}

async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
        const data = await createResident(formState);
        setResident([...resident, data]);
        setFormState(emptyResident);
        setSuccessMessage('Resident created successfully');
    } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to create resident');
    } finally {
        setIsSubmitting(false);
    }
}


function updateField<K extends keyof ResidentInput>(
    key: K, 
    value: ResidentInput[K]
) {
    setFormState((current: ResidentInput) => ({...current, [key]: value}));
}

return (
    <div className="flex flex-col items-center justify-center h-screen">
        <Navbar />
        <h1 className="text-2xl font-bold">Admin Resident Page</h1>
        {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
        {successMessage ? <p className="text-green-600">{successMessage}</p> : null}
        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center">
            <input type="text" name="caseControlNo" placeholder="Case Control No" value={formState.caseControlNo} onChange={e => updateField('caseControlNo', e.target.value)} />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create resident'}
            </button>
        </form>
    </div>
);
}

export default AdminResidentPage;