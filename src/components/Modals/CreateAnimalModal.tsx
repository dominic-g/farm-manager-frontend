import { useState, useEffect } from 'react';
import { Modal, TextInput, Select, MultiSelect, Button, Group, Stack, NumberInput, Divider, Tabs, Alert } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconInfoCircle, IconPlus, IconCheck } from '@tabler/icons-react'; // Added IconCheck
import axios from 'axios';
import { useBreeds } from '../../hooks/useBreeds';
import { useGroups } from '../../hooks/useGroups';
import { ParentSelect } from '../Inputs/ParentSelect';

interface Props {
    opened: boolean;
    close: () => void;
    parentType: any;
    editData?: any;
    isBirth?: boolean;
    initialParents?: { sire: string | null; dam: string | null };
}

const WP_API = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');

export function CreateAnimalModal({ opened, close, parentType, editData, isBirth, initialParents }: Props) {
    const queryClient = useQueryClient();
    const isEdit = !!editData;
    // const { data: breeds } = useBreeds(parentType?.id);
    // const { data: groups, createGroup } = useGroups(parentType?.id);
    const { data: breedResp } = useBreeds(parentType?.id, 1, true);
    const breeds = breedResp?.data || [];

    const { data: groupResp, createGroup } = useGroups(parentType?.id, 1, true);
    const groups = groupResp?.data || [];
    
    const [groupSearch, setGroupSearch] = useState('');
    const [mode, setMode] = useState<string | null>('single');
    
    const [localGroups, setLocalGroups] = useState<{value: string, label: string}[]>([]);

    const form = useForm({
        initialValues: {
            dob: new Date(),
            color: '',
            breeds: [] as string[],
            groups: [] as string[],
            tag: '',
            gender: 'female',
            weight: 0,
            count_male: 0,
            count_female: 0,
            total_weight: 0,
            // sire: null as string | null,
            // dam: null as string | null,
            sire: initialParents?.sire || null,
            dam: initialParents?.dam || null,
        },
        validate: {
            tag: (val, values) => (mode === 'single' && val.length < 1 ? 'Tag is required' : null),
            count_male: (val, values) => (mode === 'bulk' && val + values.count_female < 1 ? 'Add at least 1 animal' : null),
        }
    });

    const lifecycle = parentType?.farm_lifecycle || {};

    useEffect(() => {
        if (opened) {
            if (isBirth && initialParents) {
                // Force Bulk Mode for birth usually, or let user choose
                setMode('bulk'); 
                form.setValues({
                    sire: initialParents.sire,
                    dam: initialParents.dam,
                    breeds: [], // Leave empty so backend auto-calculates from parents
                    dob: new Date() // Today is birth date
                });
            }
            if (editData) {
                form.setValues({
                    tag: editData.tag,
                    gender: editData.gender,
                    weight: editData.weight || 0,
                    color: editData.color || '',

                    dob: editData.dob ? new Date(editData.dob) : new Date(),

                    // Map Parents
                    sire: editData.sire || null,
                    dam: editData.dam || null,
                    
                    breeds: editData.breed_ids ? editData.breed_ids.map(String) : [],
                    groups: editData.group_ids ? editData.group_ids.map(String) : [],
                });
            } else {
                form.reset();
            }
        }
    }, [opened, editData, initialParents]);

    const mutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const isBulk = mode === 'bulk';
            const payload = {
                bulk_mode: isBulk,
                farm_type: parentType.id,
                _farm_dob: values.dob ? new Date(values.dob).toISOString().split('T')[0] : null,
                _farm_color: values.color,
                farm_breeds: values.breeds.map(Number),
                farm_groups: values.groups.map(Number),
                title: isBulk ? null : values.tag,
                _farm_gender: isBulk ? null : values.gender,
                _farm_initial_weight: isBulk ? null : values.weight,
                count_male: isBulk ? values.count_male : 0,
                count_female: isBulk ? values.count_female : 0,
                total_weight: isBulk ? values.total_weight : 0,
                is_birth: isBirth,
                farm_sire: values.sire,
                farm_dam: values.dam,
            };
            // return axios.post(`${WP_API}/animals`, payload);

            const customApi = import.meta.env.VITE_API_BASE_URL.replace('/wp/v2', '/farm/v1');
            const standardApi = import.meta.env.VITE_API_BASE_URL;

            if (isEdit) {
                // UPDATE
                return axios.post(`${standardApi}/farm_animal/${editData.ID}`, payload); 
            } else {
                // CREATE
                return axios.post(`${customApi}/animals`, payload);
            }
        },
        onSuccess: (res) => {
            const count = res.data.created;
            notifications.show({ title: 'Success', message: `Added ${count} animals`, color: 'green' });
            queryClient.invalidateQueries({ queryKey: ['animals', parentType.id] });
            close();
            form.reset();
            setLocalGroups([]);
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message;
            notifications.show({ title: 'Error', message: msg, color: 'red' });
        }
    });

    // Prepare Data
    const breedData = breeds?.map((b: any) => ({ 
        value: String(b.id), 
        label: b.title?.rendered || 'Unnamed Breed' // Safe fallback
    })) || [];

    // Map API groups, filter out any missing IDs to prevent "undefined"
    const apiGroups = Array.isArray(groups) 
        ? groups
            .filter((g: any) => g && g.id) // Filter bad records
            .map((g: any) => ({ value: String(g.id), label: g.name || 'Unnamed' })) 
        : [];

    // Filter out duplicates safely
    const groupData = [
        ...apiGroups, 
        ...localGroups.filter(lg => !apiGroups.find(ag => ag.value === lg.value))
    ];

    // Safe comparison using Optional Chaining and fallback
    const existingGroup = groupData.find(g => 
        (g.label || '').toLowerCase() === groupSearch.toLowerCase()
    );

    const handleGroupAction = async () => {
        if (!groupSearch) return;

        if (existingGroup) {
            if (!form.values.groups.includes(existingGroup.value)) {
                form.setFieldValue('groups', [...form.values.groups, existingGroup.value]);
            }
            setGroupSearch('');
        } else {
            try {
                const newGroupRes = await createGroup(groupSearch);
                
                // Strict Validation 
                // Check if ID exists and is not 0
                const rawId = newGroupRes.data?.id;
                
                if (!rawId) {
                    console.error("Backend Error: No ID returned", newGroupRes);
                    notifications.show({ title: 'Error', message: 'Database failed to return Group ID', color: 'red' });
                    return; // Stop here! Do not corrupt state.
                }

                const newId = String(rawId);
                const newName = newGroupRes.data.name || groupSearch;

                // Update Local State safely
                setLocalGroups(prev => [...prev, { value: newId, label: newName }]);
                
                // Select it
                form.setFieldValue('groups', [...form.values.groups, newId]);
                setGroupSearch('');
                
            } catch (e) {
                console.error("Group creation failed", e);
            }
        }
    };

                    

    return (
        <Modal opened={opened} onClose={close} title={isEdit ? `Edit ${editData.tag}` :`Add ${parentType?.title.rendered || 'Animal'}`} size="lg">
            {!isEdit && <Tabs value={mode} onChange={setMode} mb="md">
                <Tabs.List>
                    <Tabs.Tab value="single">Single Entry</Tabs.Tab>
                    <Tabs.Tab value="bulk">Bulk Entry</Tabs.Tab>
                </Tabs.List>
            </Tabs>}

            <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
                <Stack>
                    {mode === 'single' ? (
                        <Group grow>
                            <TextInput label="Tag / Name" placeholder="e.g. 1045" withAsterisk {...form.getInputProps('tag')} />
                            <Select label="Gender" data={['female', 'male']} {...form.getInputProps('gender')} />
                            <NumberInput label="Weight (kg)" min={0} {...form.getInputProps('weight')} />
                        </Group>
                    ) : (
                        <>
                            <Alert variant="light" color="blue" title="Bulk Creation" icon={<IconInfoCircle/>}>
                                Tags auto-generated. Weight divided equally.
                            </Alert>
                            <Group grow>
                                <NumberInput label="Number of Females" min={0} {...form.getInputProps('count_female')} />
                                <NumberInput label="Number of Males" min={0} {...form.getInputProps('count_male')} />
                            </Group>
                            <NumberInput label="Total Batch Weight (kg)" min={0} {...form.getInputProps('total_weight')} />
                        </>
                    )}

                    <Divider label="Common Attributes" labelPosition="center" />

                    <Group grow>
                        <DatePickerInput label="Date of Birth" maxDate={new Date()} {...form.getInputProps('dob')} />
                        <TextInput label="Color / Markings" {...form.getInputProps('color')} />
                    </Group>

                    <MultiSelect
                        label="Breeds"
                        placeholder="Select breeds"
                        data={breedData}
                        searchable
                        {...form.getInputProps('breeds')}
                    />

                    <Group align="flex-end" gap="xs">
                        <MultiSelect
                            label="Groups"
                            placeholder="Select Groups"
                            data={groupData}
                            searchable
                            searchValue={groupSearch}
                            onSearchChange={setGroupSearch}
                            {...form.getInputProps('groups')}
                            style={{ flex: 1 }}
                        />
                        
                        {/* Use onMouseDown + preventDefault to beat the Blur Event */}
                        {groupSearch && (
                            <Button 
                                onMouseDown={(e) => {
                                    e.preventDefault(); 
                                    handleGroupAction();
                                }}
                                variant={existingGroup ? "outline" : "light"}
                                color={existingGroup ? "blue" : "green"}
                                leftSection={existingGroup ? <IconCheck size={14}/> : <IconPlus size={14}/>}
                            >
                                {existingGroup ? `Select` : `Create "${groupSearch}"`}
                            </Button>
                        )}
                    </Group>


                    {!isBirth && (
                        <>
                            <Divider label="Parentage (Optional)" labelPosition="center" />
                            <Group grow>
                                <ParentSelect 
                                    label="Sire (Father)" 
                                    typeId={parentType.id} 
                                    gender="male"
                                    value={form.values.sire}
                                    onChange={(val) => form.setFieldValue('sire', val)}
                                    childDob={form.values.dob}
                                    config={lifecycle}
                                />
                                <ParentSelect 
                                    label="Dam (Mother)" 
                                    typeId={parentType.id} 
                                    gender="female"
                                    value={form.values.dam}
                                    onChange={(val) => form.setFieldValue('dam', val)}
                                    childDob={form.values.dob}
                                    config={lifecycle}
                                />
                            </Group>
                        </>
                    )}

                    <Button type="submit" loading={mutation.isPending} mt="md" fullWidth>Save</Button>
                </Stack>
            </form>
        </Modal>
    );
}