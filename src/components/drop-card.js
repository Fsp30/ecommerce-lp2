
import React, { useRef } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

function Drop({ size = '' }) {

    const fileInputRef = useRef(null);

    const sizes = {
        xl: { width: '100%', minHeight: 250, iconSize: 60, fontSize: 18 },
        sm: { width: 180, minHeight: 120, iconSize: 30, fontSize: 12 },
        '': { width: 300, minHeight: 180, iconSize: 45, fontSize: 14 }
    };

    const currentSize = sizes[size] || sizes[''];

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (file) {
            console.log('Arquivo selecionado:', file);
            console.log('Nome:', file.name);
            console.log('Tamanho:', file.size);
            console.log('Tipo:', file.type);
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleFileChange}
            />

            <Card
                onClick={handleClick}
                sx={{
                    width: currentSize.width,
                    minHeight: currentSize.minHeight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: '0.2s',
                    '&:hover': {
                        borderColor: 'warning.main',
                        backgroundColor: 'action.hover'
                    }
                }}
            >
                <CardContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1
                    }}
                >
                    <UploadIcon
                        color="warning"
                        sx={{ fontSize: currentSize.iconSize }}
                    />

                    <Typography
                        sx={{
                            color: 'text.secondary',
                            fontSize: currentSize.fontSize
                        }}
                    >
                        Clique para selecionar um arquivo
                    </Typography>
                </CardContent>
            </Card>
        </>
    );
}

export default Drop;
