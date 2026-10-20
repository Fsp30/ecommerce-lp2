import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BASE_URL } from '../config/axios';
import axios from 'axios';
import { mensagemErro, mensagemSucesso } from '../components/toastr';



function CadastroCategoria() {
    const { idParam } = useParams()
    const navigate = useNavigate()

    const baseURL = `${BASE_URL}/categorias`

    const [id, setId] = useState('')
    const [categoriaPai, setCategoriaPai] = useState('')
    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState()


    const [dados, setDados] = React.useState([])
    const [dadosPai, setDadosPai] = React.useState([])

    function inicializar() {
        if (idParam === null) {
            setId('')
            setCategoriaPai('')
            setNome('')
            setDescricao('')
        } else {
            setId(dados.id)
            setCategoriaPai(dados.idCategoriaPai)
            setNome(dados.nome)
            setDescricao(dados.descricao)
        }
    }

    async function salvar() {
        let data = {
            id,
            descricao,
            categoriaPai,
            nome,
            descricao
        }
        data = JSON.stringify(data)
        if (idParam == null) {
            await axios.post(baseURL, data, {
                headers: { 'Content-Type': 'application/json' }
            }).then(function (response) {
                mensagemSucesso(`Categoria ${descricao} cadastrada com sucesso!`)
                navigate(`/listagem-categorias`)
            }).catch(function (error) {
                mensagemErro(error.response.data)
            })
        } else {
            axios
                .put(`${baseURL}/${idParam}`, data, {
                    headers: { 'Content-Type': 'application/json' },
                })
                .then(function (response) {
                    mensagemSucesso(`Categoria ${descricao} alterada com sucesso!`);
                    navigate(`/listagem-categorias`);
                })
                .catch(function (error) {
                    mensagemErro(error.response.data);
                });
        }
    }

    async function buscar() {
        await axios.get(`${baseURL}/${idParam}`).then((response) => {
            setDados(response.data)
        })
        setId(dados.id)
        if (dados.idCategoriaPai !== null) {
            await axios.get(`${baseURL}/${idCategoriaPai}`).then((response) => {
                setDadosPai(response.data)
                setCategoriaPai(dadosPai.nome)
            })
        } else {
            setCategoriaPai(dados.categoriaPai)
            setNome(dados.nome)
            setDescricao(dados.descricao)
        }
    }

    useEffect(() => {
        buscar()
    }, [id])

    if (!dados) return null

    return (
        <h1>
            Cadastro de Categoria
        </h1>
    );
}

export default CadastroCategoria;
