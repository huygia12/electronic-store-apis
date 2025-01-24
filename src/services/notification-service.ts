import prisma from "@/common/prisma-client";

const signupForNotification = async (email: string) => {
    try {
        await prisma.emailRegistration.create({
            data: {
                email: email,
            },
        });
    } catch (error: any) {
        if (error.code === "P2002") {
            console.debug(
                "[notification-service] singupForNotification : Email already exists, skipping insertion."
            );
        } else {
            throw error;
        }
    }
};

export default {signupForNotification};
