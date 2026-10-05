import { SignInResource } from '@/iam/infrastructure/sign-in.resource.js';


export class SignInAssembler {

    static toResourceFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return null;
        }
        return new SignInResource(response.data);
    }
}
