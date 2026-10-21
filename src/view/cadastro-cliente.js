import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Stack from '@mui/material/Stack';

import Card from '../components/card';
import FormGroup from '../components/form-group';

import { mensagemSucesso, mensagemErro } from '../components/toastr';

import '../custom.css';

import axios from 'axios';
import { BASE_URL } from '../config/axios';

function CadastroCliente() {
  const { idParam } = useParams();

  const navigate = useNavigate();

  const baseURL = `${BASE_URL}/clientes`;

  const [id, setId] = useState('');
  const [idUsuario, setIdUsuario] = useState(0);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [cep, setCep] = useState('');
  const [numeroResidencial, setNumeroResidencial] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [status, setStatus] = useState('ATIVO');

  const [dados, setDados] = React.useState([]);

  function inicializar() {
    if (idParam == null) {
      setId('');
      setIdUsuario(0);
      setNomeCompleto('');
      setCpf('');
      setTelefone('');
      setLogradouro('');
      setCep('');
      setNumeroResidencial('');
      setComplemento('');
      setBairro('');
      setCidade('');
      setUf('');
      setFotoUrl('');
      setStatus('ATIVO');
    } else {
      setId(dados.id);
      setIdUsuario(dados.idUsuario);
      setNomeCompleto(dados.nomeCompleto);
      setCpf(dados.cpf);
      setTelefone(dados.telefone);
      setLogradouro(dados.logradouro);
      setCep(dados.cep);
      setNumeroResidencial(dados.numeroResidencial);
      setComplemento(dados.complemento);
      setBairro(dados.bairro);
      setCidade(dados.cidade);
      setUf(dados.uf);
      setFotoUrl(dados.fotoUrl);
      setStatus(dados.status);
    }
  }

  async function salvar() {
    let data = {
      id,
      idUsuario,
      nomeCompleto,
      cpf,
      telefone,
      logradouro,
      cep,
      numeroResidencial,
      complemento,
      bairro,
      cidade,
      uf,
      fotoUrl,
      status,
    };
    data = JSON.stringify(data);
    if (idParam == null) {
      await axios
        .post(baseURL, data, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then(function (response) {
          mensagemSucesso(`Cliente ${nomeCompleto} cadastrado com sucesso!`);
          navigate(`/listagem-clientes`);
        })
        .catch(function (error) {
          mensagemErro(error.response.data);
        });
    } else {
      await axios
        .put(`${baseURL}/${idParam}`, data, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then(function (response) {
          mensagemSucesso(`Cliente ${nomeCompleto} alterado com sucesso!`);
          navigate(`/listagem-clientes`);
        })
        .catch(function (error) {
          mensagemErro(error.response.data);
        });
    }
  }

  async function buscar() {
    await axios.get(`${baseURL}/${idParam}`).then((response) => {
      setDados(response.data);
    });
    setId(dados.id);
    setIdUsuario(dados.idUsuario);
    setNomeCompleto(dados.nomeCompleto);
    setCpf(dados.cpf);
    setTelefone(dados.telefone);
    setLogradouro(dados.logradouro);
    setCep(dados.cep);
    setNumeroResidencial(dados.numeroResidencial);
    setComplemento(dados.complemento);
    setBairro(dados.bairro);
    setCidade(dados.cidade);
    setUf(dados.uf);
    setFotoUrl(dados.fotoUrl);
    setStatus(dados.status);
  }

  const [dadosUsuarios, setDadosUsuarios] = React.useState(null);

  useEffect(() => {
    axios.get(`${BASE_URL}/usuarios`).then((response) => {
      setDadosUsuarios(response.data);
    });
  }, []);

  useEffect(() => {
    buscar(); 
  }, [id]);

  if (!dados) return null;
  if (!dadosUsuarios) return null;

  return (
    <div className='container'>
      <Card title='Cadastro de Cliente'>
        <div className='row'>
          <div className='col-lg-12'>
            <div className='bs-component'>
              <FormGroup label='Usuário: *' htmlFor='selectUsuario'>
                <select
                  className='form-select'
                  id='selectUsuario'
                  name='idUsuario'
                  value={idUsuario}
                  onChange={(e) => setIdUsuario(e.target.value)}
                >
                  <option key='0' value='0'>
                    {' '}
                  </option>
                  {dadosUsuarios.map((dado) => (
                    <option key={dado.id} value={dado.id}>
                      {dado.nome}
                    </option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label='Nome Completo: *' htmlFor='inputNomeCompleto'>
                <input
                  type='text'
                  id='inputNomeCompleto'
                  value={nomeCompleto}
                  className='form-control'
                  name='nomeCompleto'
                  onChange={(e) => setNomeCompleto(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='CPF: *' htmlFor='inputCpf'>
                <input
                  type='text'
                  maxLength='11'
                  id='inputCpf'
                  value={cpf}
                  className='form-control'
                  name='cpf'
                  onChange={(e) => setCpf(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Telefone:' htmlFor='inputTelefone'>
                <input
                  type='text'
                  id='inputTelefone'
                  value={telefone}
                  className='form-control'
                  name='telefone'
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Logradouro:' htmlFor='inputLogradouro'>
                <input
                  type='text'
                  id='inputLogradouro'
                  value={logradouro}
                  className='form-control'
                  name='logradouro'
                  onChange={(e) => setLogradouro(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='CEP:' htmlFor='inputCep'>
                <input
                  type='text'
                  maxLength='8'
                  id='inputCep'
                  value={cep}
                  className='form-control'
                  name='cep'
                  onChange={(e) => setCep(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Número:' htmlFor='inputNumeroResidencial'>
                <input
                  type='text'
                  id='inputNumeroResidencial'
                  value={numeroResidencial}
                  className='form-control'
                  name='numeroResidencial'
                  onChange={(e) => setNumeroResidencial(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Complemento:' htmlFor='inputComplemento'>
                <input
                  type='text'
                  id='inputComplemento'
                  value={complemento}
                  className='form-control'
                  name='complemento'
                  onChange={(e) => setComplemento(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Bairro:' htmlFor='inputBairro'>
                <input
                  type='text'
                  id='inputBairro'
                  value={bairro}
                  className='form-control'
                  name='bairro'
                  onChange={(e) => setBairro(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Cidade:' htmlFor='inputCidade'>
                <input
                  type='text'
                  id='inputCidade'
                  value={cidade}
                  className='form-control'
                  name='cidade'
                  onChange={(e) => setCidade(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='UF:' htmlFor='inputUf'>
                <input
                  type='text'
                  maxLength='2'
                  id='inputUf'
                  value={uf}
                  className='form-control'
                  name='uf'
                  onChange={(e) => setUf(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Foto (URL):' htmlFor='inputFotoUrl'>
                <input
                  type='text'
                  id='inputFotoUrl'
                  value={fotoUrl}
                  className='form-control'
                  name='fotoUrl'
                  onChange={(e) => setFotoUrl(e.target.value)}
                />
              </FormGroup>
              <FormGroup label='Status:' htmlFor='selectStatus'>
                <select
                  className='form-select'
                  id='selectStatus'
                  name='status'
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value='ATIVO'>ATIVO</option>
                  <option value='INATIVO'>INATIVO</option>
                </select>
              </FormGroup>
              <Stack spacing={1} padding={1} direction='row'>
                <button
                  onClick={salvar}
                  type='button'
                  className='btn btn-success'
                >
                  Salvar
                </button>
                <button
                  onClick={inicializar}
                  type='button'
                  className='btn btn-danger'
                >
                  Cancelar
                </button>
              </Stack>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CadastroCliente;
