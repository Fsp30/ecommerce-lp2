
import React, { useState } from 'react';

import Drop from '../drop-card';
import ProductImageGrid from '../product-image-grid';

import { Box, Typography } from '@mui/material';

function ProductForm() {

    const [images, setImages] = useState([]);

    const handleFilesSelected = (newFiles) => {
        setImages(previous => [...previous, ...newFiles]);
    };

    return (
        <Box sx={{ width: '100%', p: 2 }}>

            <Typography variant="h6" gutterBottom>
                Fotos do produto
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
                Adicione fotos e arraste para organizar a ordem de exibição.
                A primeira imagem será a foto principal do produto.
            </Typography>

            <Drop
                onFilesSelected={handleFilesSelected}
            />

            <Box mt={3}>
                <ProductImageGrid
                    files={images}
                    onChange={setImages}
                />
            </Box>

        </Box>
    );
}

export default ProductForm;
