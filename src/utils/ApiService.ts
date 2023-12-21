import axios from 'axios';
import Organization from './Organization';

/**
 * This class is used to make requests to the backend API.
 */
class APIService {
	static host = import.meta.env.VITE_API_URL;

	/**
	 * Check if the user can login with the given credentials.
	 * @param schema The username to login
	 * @returns A promise that resolves to true if the login was successful, false otherwise.
	 */
	static async login(username: string, password: string): Promise<boolean> {
		try {
			const url = `${this.host}/login`;
			const resp = await axios.post(url, {
				username: username,
				password: password,
			});
			if (resp.status === 200) {
				const token = resp.data.token;
				sessionStorage.setItem('user-token', token);
			}

			return resp.status === 200;
		} catch (e) {
			sessionStorage.removeItem('user-token');
			return false;
		}
	}

	/**
	 * Check if the user can register with the given credentials.
	 * @param username The username to register
	 * @param password The password to register
	 * @returns A promise that resolves to true if the registration was successful, false otherwise.
	 */
	static async register(
		username: string,
		password: string
	): Promise<boolean | undefined> {
		try {
			const url = `${this.host}/register`;
			const resp = await axios.post(url, {
				username: username,
				password: password,
			});
			if (resp.status === 201) {
				const token = resp.data.token;
				sessionStorage.setItem('user-token', token);
				return true;
			}
			return false;
		} catch (err) {
			return undefined;
		}
	}

	/**
	 * Check if the user can register with the given credentials.
	 * @param username The username to register
	 * @param password The password to register
	 * @returns A promise that resolves to true if the registration was successful, false otherwise.
	 */
	static async deleteUser(
		username: string,
		password: string
	): Promise<boolean> {
		try {
			const url = `${this.host}/deleteUser`;
			const resp = await axios.post(
				url,
				{
					username: username,
					password: password,
				},
				{
					headers: {
						Authorization: this.getUserToken(),
					},
				}
			);
			if (resp.status === 204) {
				this.clearUserToken();
				return true;
			}
			return false;
		} catch (err) {
			return false;
		}
	}

	static async getOrganizations(): Promise<number[] | undefined> {
		try {
			const url = `${this.host}/getOrganisations`;
			const resp = await axios.get(url, {
				headers: {
					Authorization: this.getUserToken(),
				},
			});
			if (resp.status == 200) {
				return resp.data.organisation_ids as number[];
			}
			if (resp.status == 204) return undefined;
		} catch (err) {
			return undefined;
		}
	}

	static async getOrganizationNames(): Promise<Organization[] | undefined> {
		try {
			const url = `${this.host}/getOrganisationNames`;
			const resp = await axios.get<{
				organisations: Organization[];
			}>(url, {
				headers: {
					Authorization: this.getUserToken(),
				},
			});
			if (resp.status == 200) {
				return resp.data.organisations;
			}
			if (resp.status == 404) return undefined;
		} catch (err) {
			return undefined;
		}
	}

	static async getNameForOrganization(
		id: number
	): Promise<string | undefined> {
		try {
			const url = `${this.host}/getOrganisationName/${id}`;
			const resp = await axios.get(url, {
				headers: {
					Authorization: this.getUserToken(),
				},
			});
			if (resp.status == 200) {
				return resp.data.organisation_name as string;
			}
			if (resp.status == 404) return undefined;
		} catch (err) {
			return undefined;
		}
	}

	/**
	 * Create a new organization.
	 * @param orgName The name of the organization to create
	 * @returns The ID of the created organization or undefined if the creation failed
	 */
	static async createOrganization(
		orgName: string
	): Promise<number | undefined> {
		try {
			const url = `${this.host}/createOrganisation`;
			const resp = await axios.post(
				url,
				{
					organisationName: orgName,
				},
				{
					headers: {
						Authorization: this.getUserToken(),
					},
				}
			);
			if (resp.status === 200) {
				sessionStorage.setItem(
					'organisation',
					JSON.stringify({
						name: orgName,
						id: resp.data.organisation_id as number,
					})
				);
				return resp.data.organisation_id as number;
			}
		} catch (err) {
			return undefined;
		}
	}

	/**
	 * Upload files to the server.
	 * @param data Array of files to upload
	 * @param organisationId id of the Organisation to upload files to
	 * @returns A string with the status of the upload
	 */
	static async upload(data: Blob[], organisationId: number): Promise<string> {
		try {
			const body = new FormData();
			for (let i = 0; i < data.length; i++) {
				body.append('file', data[i]);
			}

			body.append('organisationId', organisationId.toString());

			const resp = await axios.post(`${this.host}/data/upload`, body, {
				headers: {
					'Content-Type': 'multipart/form-data',
					Authorization: this.getUserToken(),
				},
			});
			if (resp.status === 201) {
				return 'File uploaded successfully';
			}
			if (resp.status === 207) {
				return 'File uploaded partially successfully';
			}
			return 'Error uploading file';
		} catch (err) {
			return 'Error uploading file';
		}
	}

	// TODO
	static getFileNames(username: string): Promise<string[]> {
		return axios
			.get(`${this.host}/get/file/names/${username}`)
			.then((resp) => {
				return resp.data;
			})
			.catch(() => {
				return [];
			});
	}

	// TODO
	static getFileContent(username: string, filename: string): Promise<string> {
		return axios
			.get(`${this.host}/get/file/content/${username}/${filename}`)
			.then((resp) => {
				return resp.data;
			})
			.catch(() => {
				return 'Error getting file content!';
			});
	}

	static getUserToken(): string | null {
		const token = sessionStorage.getItem('user-token');
		if (token == null) {
			throw new Error('User not logged in');
		}
		return token;
	}

	static setUserToken(token: string) {
		if (token === '') {
			throw new Error('not a valid token');
		}
		sessionStorage.setItem('user-token', token);
	}

	static clearUserToken() {
		sessionStorage.removeItem('user-token');
	}
}

export default APIService;
