/********************************************************************************
 * Copyright (c) 2019 TypeFox and others
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 ********************************************************************************/

import { createVSIX } from 'vsce';
import { createTempFile, addEnvOptions } from './util';
import { Registry, DEFAULT_URL, RegistryOptions } from './registry';
import { checkLicense } from './check-license';

/**
 * Publishes an extension.
 */
export async function publish(options: PublishOptions = {}): Promise<void> {
    addEnvOptions(options);
    if (!options.pat) {
        throw new Error("A personal access token must be given with the option '--pat'.");
    }

    const registry = new Registry(options);
    if (!options.extensionFile) {
        await packageExtension(options, registry);
        console.log(); // new line
    }

    const extension = await registry.publish(options.extensionFile!, options.pat);
    if (extension.error) {
        throw new Error(extension.error);
    }
    console.log(`\ud83d\ude80  Published ${extension.namespace}.${extension.name} v${extension.version}`);
    if (registry.url === DEFAULT_URL) {
        console.log('The open-vsx.org website will be transferred to the Eclipse Foundation on December 9. '
            + 'Please read the blog post referenced below to find out more. '
            + 'Some action will be required so you can continue publishing.\n'
            + 'https://blogs.eclipse.org/post/brian-king/open-vsx-registry-under-new-management');
    }
}

export interface PublishOptions extends RegistryOptions {
    /**
     * Path to the vsix file to be published. Cannot be used together with `packagePath`.
     */
    extensionFile?: string;
    /**
     * Path to the extension to be packaged and published. Cannot be used together
     * with `extensionFile`.
     */
    packagePath?: string;
    /**
	 * The base URL for links detected in Markdown files. Only valid with `packagePath`.
	 */
    baseContentUrl?: string;
    /**
	 * The base URL for images detected in Markdown files. Only valid with `packagePath`.
	 */
    baseImagesUrl?: string;
    /**
	 * Should use `yarn` instead of `npm`. Only valid with `packagePath`.
	 */
    yarn?: boolean;
}

async function packageExtension(options: PublishOptions, registry: Registry): Promise<void> {
    if (registry.requiresLicense) {
        await checkLicense(options.packagePath);
    }

    options.extensionFile = await createTempFile({ postfix: '.vsix' });
    await createVSIX({
        cwd: options.packagePath,
        packagePath: options.extensionFile,
        baseContentUrl: options.baseContentUrl,
        baseImagesUrl: options.baseImagesUrl,
        useYarn: options.yarn
    });
}
