import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardMedia,
    IconButton,
    Typography,
    Tooltip,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

function ProductImageGrid({ files = [], onChange }) {
    const [previews, setPreviews] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);

    useEffect(() => {
        const images = files.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));

        setPreviews(images);

        return () => {
            images.forEach((image) => URL.revokeObjectURL(image.url));
        };
    }, [files]);

    const handleDrop = (targetIndex) => {
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            return;
        }

        const updatedFiles = [...files];

        const [movedFile] = updatedFiles.splice(draggedIndex, 1);

        updatedFiles.splice(targetIndex, 0, movedFile);

        onChange(updatedFiles);
        setDraggedIndex(null);
    };

    const handleRemove = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        onChange(updatedFiles);
    };

    if (files.length === 0) return null;

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 2,
                width: "100%",
            }}
        >
            {previews.map((image, index) => (
                <Card
                    key={`${image.file.name}-${image.file.lastModified}-${index}`}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => setDraggedIndex(null)}
                    sx={{
                        position: "relative",
                        cursor: "grab",
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "2px solid",
                        borderColor:
                            draggedIndex === index ? "warning.main" : "divider",
                        opacity: draggedIndex === index ? 0.4 : 1,
                        transition: "0.2s",
                        "&:hover": {
                            borderColor: "warning.main",
                        },
                    }}
                >
                    <CardMedia
                        component="img"
                        image={image.url}
                        alt={`Imagem do produto ${index + 1}`}
                        sx={{
                            width: "100%",
                            aspectRatio: "1 / 1",
                            objectFit: "cover",
                        }}
                    />

                    <Box
                        sx={{
                            position: "absolute",
                            top: 5,
                            left: 5,
                            backgroundColor: "rgba(0,0,0,0.65)",
                            color: "white",
                            borderRadius: 1,
                            px: 1,
                            py: 0.3,
                        }}
                    >
                        <Typography variant="caption">
                            {index === 0 ? "Principal" : index + 1}
                        </Typography>
                    </Box>

                    <Tooltip title="Arraste para reorganizar">
                        <IconButton
                            size="small"
                            sx={{
                                position: "absolute",
                                bottom: 5,
                                left: 5,
                                backgroundColor: "rgba(255,255,255,0.9)",
                                "&:hover": {
                                    backgroundColor: "white",
                                },
                            }}
                        >
                            <DragIndicatorIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Remover imagem">
                        <IconButton
                            size="small"
                            onClick={() => handleRemove(index)}
                            sx={{
                                position: "absolute",
                                top: 5,
                                right: 5,
                                backgroundColor: "rgba(255,255,255,0.9)",
                                color: "error.main",
                                "&:hover": {
                                    backgroundColor: "white",
                                },
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Card>
            ))}
        </Box>
    );
}

export default ProductImageGrid;
