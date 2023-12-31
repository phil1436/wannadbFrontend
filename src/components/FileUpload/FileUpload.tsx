import { ChangeEvent, useState } from 'react';
import APIService from '../../utils/ApiService';
import './FileUpload.scss';
import {
	useShowNotification,
	useShowChoiceNotification,
} from '../../providers/NotificationProvider';
import { useGetOrganizations } from '../../providers/OrganizationProvider';
import FileViewer from '../FileViewer/FileViewer';

/**
 * A component where the user can upload files
 */
function FileUpload() {
	const [files, setFiles] = useState<File[]>([]);
	const [viewFile, setViewFile] = useState<File | undefined>(undefined);
	const [stagedFiles, setstagedFiles] = useState<File[]>([]);
	const [selectedOrg, setSelectedOrg] = useState(-1);

	const showNotification = useShowNotification();
	const showChoiceNotification = useShowChoiceNotification();

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		// Get the selected file
		const selectedFiles = event.target.files;
		if (selectedFiles === null) return;
		setstagedFiles([...selectedFiles, ...Array.from(stagedFiles)]);
	};

	const getOrganizations = useGetOrganizations();

	const addFile = (force: boolean = false) => {
		if (stagedFiles.length === 0) {
			return;
		}
		if (!force) {
			for (const stagedFile of stagedFiles) {
				for (const file of files) {
					if (
						file.name === stagedFile.name &&
						file.size === stagedFile.size &&
						file.lastModified === stagedFile.lastModified
					) {
						showChoiceNotification(
							'File upload',
							`The file ${stagedFile.name} is already in the list. Do you want to add it anyway?`,
							() => addFile(true),
							() => {},
							'Yes',
							'No'
						);
						return;
					}
				}
			}
		}

		setFiles([...files, ...stagedFiles]);
		setstagedFiles([]);
	};

	const discardFiles = () => {
		setstagedFiles([]);
	};

	const removeFile = (index: number) => {
		const newFiles = [...files];
		newFiles.splice(index, 1);
		setFiles(newFiles);
	};

	const handleUpload = () => {
		if (files.length === 0) return;
		APIService.upload(files, selectedOrg).then((res) => {
			showNotification('File upload', res);
			setFiles([]);
		});
	};

	if (getOrganizations().length === 0) {
		return (
			<p>
				<i>
					You have to be a member of an organization to upload files.
					You can create a new organization{' '}
					<a href="/organization/create">here</a>.
				</i>
			</p>
		);
	}

	return (
		<div className="FileUpload">
			{viewFile !== undefined && (
				<FileViewer
					file={viewFile}
					onClose={() => {
						setViewFile(undefined);
					}}
				/>
			)}
			{getOrganizations().length === 1 && (
				<p>
					<b>Organization:</b> {getOrganizations()[0].name}
				</p>
			)}
			{getOrganizations().length > 1 && (
				<div className="hor mb">
					<p>
						<b>Select a Organization:</b>
					</p>
					<select
						className="btn"
						style={{
							width: '200px',
							marginLeft: '20px',
						}}
						name="organization"
						id="organization"
						onChange={(e) => {
							const name = e.target.value;
							const organization = getOrganizations().find(
								(org) => org.name === name
							);
							if (organization === undefined) return;
							setSelectedOrg(organization.id);
						}}
					>
						{getOrganizations().map((organization) => (
							<option
								value={organization.name}
								key={organization.id}
							>
								{organization.name}
							</option>
						))}
					</select>
				</div>
			)}
			<div className="hor mb">
				<input
					type="file"
					onChange={handleFileChange}
					accept=".txt,.bson"
					multiple={true}
				/>
			</div>
			<div className="hor mb">
				<button className="btn" onClick={() => addFile()}>
					Add
				</button>
				<button className="btn" onClick={discardFiles}>
					Discard
				</button>
			</div>
			{files.map((file, index) => (
				<li className="file" key={index}>
					<div className="dot"></div>
					<p>{file.name}</p>
					<i
						className="bi bi-eye icon"
						onClick={() => setViewFile(file)}
					></i>
					<i
						className="bi bi-x-circle icon"
						onClick={() => removeFile(index)}
					></i>
				</li>
			))}
			<div className="ver">
				{files.length > 0 && (
					<button
						className="btn uploadFile"
						style={{ width: '200px' }}
						onClick={handleUpload}
						disabled={files.length === 0}
					>
						Upload File{files.length > 1 && 's'}
					</button>
				)}
			</div>
		</div>
	);
}
export default FileUpload;
