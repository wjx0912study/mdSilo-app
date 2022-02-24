import * as dialog from '@tauri-apps/api/dialog'
import DirectoryAPI from './directory';
import FileAPI from './files';
import { processJson, processMds } from './process';

/**
 * Diago to get dir path to open
 * @returns 
 */
export const openDirDilog = async () => {
  const dirPath  = await dialog.open({
    directory: true,
    multiple: false,
    filters: [
      {name: 'dir', extensions: ['md', 'json']}
    ],
  });
  return dirPath;
};

/**
 * Open dir and process files
 * @param dir 
 * @param writeHistory 
 * @returns 
 */
export const openDir = async (dir: string, writeHistory = true): Promise<void> => {
  //
  const dirInfo = new DirectoryAPI(dir);
  console.log("dir api", dirInfo)
  if (!(await dirInfo.exists())) {
    console.log('Directory not exists');
    return;
  }

  const jsonInfo = new FileAPI('mdSilo_all.json', dir);
  console.log("json", jsonInfo)
  if (await jsonInfo.exists()) {
    // process json
    const fileContent = await jsonInfo.readFile();
    processJson(fileContent);
    return;
  }

  const files = await dirInfo.getFiles();
  const openFiles = files.files;
  if (openFiles.length) {
    // attach listener to monitor changes in dir
    dirInfo.listen(() => {/*TODO*/ console.log("listen dir change")}); // TODO
    // console.timeEnd(dir);
    // process files
    processMds(openFiles);
    return;
  }
}

/**
 * diago to get file paths to open
 * @param ty file type: md or json
 * @param multi multi-select or not
 * @returns 
 */
export const openFileDilog = async (ty: string, multi = true) => {
  const filePaths = await dialog.open({
    directory: false,
    multiple: multi,
    filters: [
      {
        name: 'file', 
        extensions:  ty === 'json' ? ['json'] : ty === 'md' ? ['md'] : ['md', 'json']
      }
    ],
  });
  return filePaths;
};

/**
 * Open and process files
 * @param filePaths 
 * @param ty file type: md or json
 * @param writeHistory 
 * @returns 
 */
export async function openFile(
  filePaths: string[], 
  ty = 'md', 
  writeHistory = true
) {
  if (ty === 'json') {
    const filePath = filePaths[0];
    if (filePath && filePath.endsWith('.json')) {
      const jsonInfo = new FileAPI(filePath);
      if (await jsonInfo.exists()) {
        // process json
        const fileContent = await jsonInfo.readFile();
        processJson(fileContent);
        return;
      }
    }
  } else {
    const openFiles = [];
    for (const filePath of filePaths) {
      const fileInfo = new FileAPI(filePath);
  
      if (await fileInfo.exists()) {
        // process json
        const fileMeta = await fileInfo.getMetadata();
        openFiles.push(fileMeta);
      } 
    }
    // process files
    processMds(openFiles);
    return;
  }
}
