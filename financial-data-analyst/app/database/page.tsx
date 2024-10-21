// @ts-nocheck
"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

const PostgreSQLConfigPage = () => {
    const router = useRouter();
    const [dataSources, setDataSources] = useState([]);
    const [currentDataSource, setCurrentDataSource] = useState({
        id: null,
        name: '',
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
    });
    const [tables, setTables] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);


    useEffect(() => {
        fetchDataSources();
    }, []);

    const fetchDataSources = async () => {
        try {
            const response = await fetch('/api/postgresql-config');
            if (!response.ok) throw new Error('Failed to fetch data sources');
            const data = await response.json();
            setDataSources(data);
        } catch (error) {
            console.error('Error fetching data sources:', error);
            toast({
                title: "Error",
                description: "Failed to fetch data sources.",
                variant: "destructive",
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentDataSource(prev => ({ ...prev, [name]: value }));
    };

    const refreshTables = async () => {
        setIsRefreshing(true);
        try {
            console.log(currentDataSource);
            const response = await fetch('/api/database-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentDataSource),
            });

            const data = await response.json();

            if (response.ok) {
                setTables(data.tables);
                toast({
                    title: "Tables Refreshed",
                    description: `Successfully retrieved ${data.tables.length} tables.`,
                });
            } else {
                throw new Error(data.error || 'Failed to retrieve tables');
            }
        } catch (error) {
            console.error('Error refreshing tables:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to refresh tables.",
                variant: "destructive",
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleTableSelection = (tableName) => {
        setSelectedTables(prev =>
            prev.includes(tableName)
                ? prev.filter(t => t !== tableName)
                : [...prev, tableName]
        );
    };

    const saveConfiguration = async () => {
        if (selectedTables.length === 0) {
            toast({
                title: "Error",
                description: "Please select at least one table.",
                variant: "destructive",
            });
            return;
        }
        try {
            const url = '/api/postgresql-config';
            const method = isEditing ? 'PUT' : 'POST';
            const dataToSend = { ...currentDataSource, tables: selectedTables };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });
            if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'save'} configuration`);
            const result = await response.json();
            const updatedDataSource = { ...dataToSend, id: result.id };
            if (isEditing) {
                setDataSources(prev => prev.map(ds => ds.id === currentDataSource.id ? updatedDataSource : ds));
            } else {
                setDataSources(prev => [...prev, updatedDataSource]);
            }
            toast({
                title: `Configuration ${isEditing ? 'Updated' : 'Saved'}`,
                description: `Data source "${currentDataSource.name}" ${isEditing ? 'updated' : 'added'} successfully.`,
            });
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'saving'} configuration:`, error);
            toast({
                title: "Error",
                description: `Failed to ${isEditing ? 'update' : 'save'} configuration.`,
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setCurrentDataSource({
            id: null,
            name: '',
            host: '',
            port: '',
            database: '',
            username: '',
            password: '',
        });
        setTables([]);
        setSelectedTables([]);
        setIsEditing(false);
    };

    const handleEdit = (dataSource) => {
        setCurrentDataSource(dataSource);
        setIsEditing(true);
        setIsDialogOpen(true);
        setSelectedTables(dataSource.tables || []);
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/postgresql-config?id=${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete data source');
            setDataSources(prev => prev.filter(ds => ds.id !== id));
            toast({
                title: "Data Source Deleted",
                description: "The data source was successfully deleted.",
            });
        } catch (error) {
            console.error('Error deleting data source:', error);
            toast({
                title: "Error",
                description: "Failed to delete data source.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Datasource Configuration</h1>
                <Button variant="outline" onClick={() => router.push('/')}>
                    Back to Home
                </Button>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Configured Data Sources</CardTitle>
                    <CardDescription>List of all configured PostgreSQL data sources</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Host</TableHead>
                                <TableHead>Tables</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dataSources.map(source => (
                                <TableRow key={source.id}>
                                    <TableCell>{source.name}</TableCell>
                                    <TableCell>{source.host}</TableCell>
                                    <TableCell>{source.tables ? source.tables.join(', ') : 'None'}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(source)}>Edit</Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="ml-2"
                                            onClick={() => handleDelete(source.id)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogTrigger asChild>
                    <Button>Add New Data Source</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit' : 'Add New'} PostgreSQL Data Source</DialogTitle>
                        <DialogDescription>
                            Enter the details for your PostgreSQL database connection.
                            {isEditing && ' Leave the password blank to keep the existing password.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {Object.entries(currentDataSource).filter(([key]) => key !== 'id').map(([key, value]) => (
                            <div key={key} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={key} className="text-right">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </Label>
                                <Input
                                    id={key}
                                    name={key}
                                    value={value}
                                    onChange={handleInputChange}
                                    type={key === 'password' ? 'password' : 'text'}
                                    className="col-span-3"
                                    placeholder={key === 'password' && isEditing ? 'Enter new password or leave blank' : ''}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button onClick={refreshTables} disabled={isRefreshing}>
                            {isRefreshing ? 'Refreshing...' : 'Pick Tables'}
                        </Button>
                    </div>
                    {tables.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Select Tables:</h3>
                            <div className="space-y-2">
                                {tables.map(table => (
                                    <div key={table} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`table-${table}`}
                                            checked={selectedTables.includes(table)}
                                            onCheckedChange={() => handleTableSelection(table)}
                                        />
                                        <label htmlFor={`table-${table}`}>{table}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <hr />
                    <DialogFooter>
                        <Button onClick={saveConfiguration} disabled={selectedTables.length === 0}>
                            {isEditing ? 'Update' : 'Save'} Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PostgreSQLConfigPage;