import { SignUpResource } from '@/iam/infrastructure/sign-up.resource.js';


export class SignUpAssembler {

    static toResourceFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return null;
        }
        return new SignUpResource(response.data);
    }
}
