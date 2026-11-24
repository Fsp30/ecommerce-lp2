import axios from "axios";
import { BASE_URL } from "../config/axios";

export function salvarRegistro(recurso, registro) {
    return axios.put(`${BASE_URL}/${recurso}/${registro.id}`, registro, {
        headers: { "Content-Type": "application/json" },
    });
}