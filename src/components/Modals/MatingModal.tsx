import { useState, useMemo } from 'react';
import { Modal, Button, Stack, Alert, Loader } from '@mantine/core'; // Removed unused imports
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { ParentSelect } from '../Inputs/ParentSelect';
import { IconHeartHandshake, IconAlertTriangle, IconCheck, IconLink, IconInfoCircle } from '@tabler/icons-react';

interface Props {
    opened: boolean;
    close: () => void;
    animal: any;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function MatingModal({ opened, close, animal }: Props) {
    const queryClient = useQueryClient();
    const [isExternal, setIsExternal] = useState(false);
    const gestation = Number(animal?.config?.lifecycle?.gestation || 0);

    const form = useForm({
        initialValues: {
            date: new Date(),
            sire_id: null as string | null,
            notes: ''
        },
        // Validation: Require sire if not external
        validate: {
            sire_id: (val) => (!isExternal && !val ? 'Please select a Sire' : null)
        }
    });

    // 1. Fetch Selected Sire
    const { data: selectedSire, isLoading: loadingSire } = useQuery({
        queryKey: ['animal_relationship', form.values.sire_id],
        queryFn: async () => {
            if (!form.values.sire_id) return null;
            const res = await axios.get(`${API_BASE}/animals`, {
                params: { 
                    type_id: animal.type_id,
                    animal_ids: [form.values.sire_id] // Requires the backend update mentioned previously
                }
            });
            return res.data[0];
        },
        enabled: !!form.values.sire_id && !isExternal
    });

    const mutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            // FIX: Ensure date is properly formatted for backend
            const isoDate = values.date ? new Date(values.date).toISOString() : new Date().toISOString();

            return axios.post(`${API_BASE}/logs`, {
                animal_ids: [animal.id],
                event_type: 'mating',
                event_date: isoDate,
                sire_id: isExternal ? null : values.sire_id,
                value: 1, // Logic placeholder
                notes: isExternal 
                    ? `Service by External Sire / AI. ${values.notes}` 
                    : `Served by Sire #${selectedSire?.tag || values.sire_id}. ${values.notes}`,
            });
        },
        onSuccess: () => {
            notifications.show({ title: 'Success', message: 'Mating recorded. Pregnancy status updated.', color: 'green' });
            queryClient.invalidateQueries({ queryKey: ['animal'] });
            close();
            form.reset();
            setIsExternal(false);
        },
        // FIX: ADDED ERROR HANDLING
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || 'Unknown Error';
            notifications.show({ title: 'Mating Failed', message: msg, color: 'red', autoClose: 5000 });
        }
    });

    // 2. Relationship Checker (Same as before)
    const relationship = useMemo(() => {
        if (isExternal) return { status: 'safe', label: 'External / AI', color: 'teal', icon: IconLink, message: 'Genetic diversity assumed.' };
        if (!selectedSire) return null;

        const female = animal;
        const male = selectedSire;

        if (!male.parents || !female.parents) return { status: 'unknown', label: 'Unknown Relationship', color: 'gray', icon: IconInfoCircle, message: 'Parentage data missing.' };

        const shareSire = male.parents.sire_id && female.parents.sire?.id && String(male.parents.sire_id) === String(female.parents.sire.id);
        const shareDam = male.parents.dam_id && female.parents.dam?.id && String(male.parents.dam_id) === String(female.parents.dam.id);

        if (shareSire || shareDam) {
            return { 
                status: 'warning', 
                label: 'Inbreeding Risk: Sibling', 
                color: 'red', 
                icon: IconAlertTriangle, 
                message: `These animals share a parent (${shareSire ? 'Father' : 'Mother'}).` 
            };
        }

        if (String(female.parents.sire?.id) === String(male.ID) || String(female.parents.dam?.id) === String(male.ID)) {
             return { status: 'warning', label: 'Inbreeding Risk: Parent', color: 'red', icon: IconAlertTriangle, message: 'Direct parent-child relationship.' };
        }

        return { status: 'safe', label: 'No Immediate Relation', color: 'green', icon: IconCheck, message: 'No shared parents found.' };

    }, [selectedSire, isExternal, animal]);

    // 3. Date Calc
    const dueDateInfo = useMemo(() => {
        if (!form.values.date || gestation === 0) return null;
        const date = new Date(form.values.date);
        date.setDate(date.getDate() + gestation);
        return date.toDateString();
    }, [form.values.date, gestation]);

    return (
        <Modal opened={opened} onClose={close} title="Log Mating / Service">
            <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
                <Stack>
                    <DatePickerInput 
                        label="Date of Service" 
                        maxDate={new Date()} 
                        {...form.getInputProps('date')} 
                    />
                    
                    <Button 
                        variant={isExternal ? "filled" : "light"} 
                        color={isExternal ? "teal" : "gray"}
                        onClick={() => {
                            setIsExternal(!isExternal);
                            form.setFieldValue('sire_id', null);
                        }}
                        fullWidth mb="sm"
                    >
                        {isExternal ? "Using External Sire / AI" : "Switch to External / AI"}
                    </Button>

                    {!isExternal && (
                        <ParentSelect 
                            label="Select Sire (Father)" 
                            typeId={animal?.type_id || 0}
                            gender="male"
                            value={form.values.sire_id}
                            onChange={(v) => form.setFieldValue('sire_id', v)}
                            childDob={new Date()} 
                            config={animal?.config?.lifecycle}
                            compareWith={animal}
                        />
                    )}

                    {relationship && (
                        <Alert variant="light" color={relationship.color} title={relationship.label} icon={<relationship.icon />}>
                            {relationship.message}
                        </Alert>
                    )}
                    
                    {loadingSire && <Loader size="sm" />}

                    {dueDateInfo && (
                        <Alert icon={<IconHeartHandshake/>} color="pink" variant="light" title="Projected Dates">
                            Expected Birth: <b>{dueDateInfo}</b>
                        </Alert>
                    )}

                    <Button type="submit" loading={mutation.isPending} color="pink" mt="md" disabled={relationship?.status === 'warning'}>
                        {relationship?.status === 'warning' ? 'Unsafe Mating' : 'Confirm Service'}
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}