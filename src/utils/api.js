import axios from "axios";
import { BASE_URL } from "../config/axios";

export async function listar(recurso) {
    const { data } = await axios.get(`${BASE_URL}/${recurso}`);
    return Array.isArray(data) ? data : [];
}

export function atualizar(recurso, id, dados) {
    return axios.patch(`${BASE_URL}/${recurso}/${id}`, dados);
}

export function porId(lista) {
    return new Map(lista.map((item) => [String(item.id), item]));
}
