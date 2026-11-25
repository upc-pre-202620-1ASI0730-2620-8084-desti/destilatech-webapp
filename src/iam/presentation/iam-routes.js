const signIn = () => import('./views/sign-in.vue');
const signUp = () => import('./views/sign-up.vue');


/**
 * Public routes of the IAM bounded context. The landing page links to /register?type=producer|retailer
 * and /register?plan=basic|professional|enterprise.
 */
const iamRoutes = [
    { path: '/login', name: 'sign-in', component: signIn, meta: { title: 'iam.sign-in.title', public: true, guestOnly: true } },
    { path: '/register', name: 'sign-up', component: signUp, meta: { title: 'iam.sign-up.title', public: true, guestOnly: true } }
];

export default iamRoutes;
