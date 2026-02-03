import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./TestButton";

const meta: Meta<typeof Button> = {
    title: "Components/Test/TestButton",
    component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
    args: {
        label: "Test",
    },
};