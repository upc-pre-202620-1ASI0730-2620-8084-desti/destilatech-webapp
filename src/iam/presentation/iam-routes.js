const signIn = () => import('./views/sign-in.vue');
const signUp = () => import('./views/sign-up.vue');
const accountProfile = () => import('./views/account-profile.vue');


const iamRoutes = {
    publicRoutes: [
        { path: '/sign-in', name: 'sign-in', component: signIn, meta: { title: 'iam.sign-in.title', guestOnly: true } },
        { path: '/sign-up', name: 'sign-up', component: signUp, meta: { title: 'iam.sign-up.title', guestOnly: true } },
        { path: '/registro', redirect: to => ({ name: 'sign-up', query: to.query }) },
        { path: '/login', redirect: { name: 'sign-in' } }
    ],
    privateRoutes: [
        {
            path: 'account/profile',
            name: 'account-profile',
            component: accountProfile,
            meta: { title: 'iam.profile.title', allowWithoutAccess: true }
        }
    ]
};

export default iamRoutes;
