import React from 'react'
import UploadIcon from '@mui/icons-material/Upload';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';

const bull = (
    <Box
        component="span"
        sx={{display: 'inline-block', mx: '4px', transform: 'scale(0.8)'}}
    >
         •
  </Box>
)

function Drop(){
    return(
        <Card>
            <CardContent>
                <Typography gutterBottom sx={{color: 'text.secondary', fontSize: 14}}>
                    Teste texto
                </Typography>
            </CardContent>
        </Card>
    )
}

export default Drop